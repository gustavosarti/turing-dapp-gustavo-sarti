const { expect } = require("chai");
const { loadFixture, impersonateAccount, setBalance } = require("@nomicfoundation/hardhat-network-helpers");
const { ethers } = require("hardhat");

const T = (n) => ethers.utils.parseEther(String(n)); // n Turings (18 decimais)

describe("Turing", function () {
  async function deployFixture() {
    const signers = await ethers.getSigners();
    // conta #0 = owner (deployer); #1..#5 = nome1..nome5; #6 = fora da tabela
    const [owner, a1, a2, a3, a4, a5, intruso] = signers;
    const Turing = await ethers.getContractFactory("Turing");
    const turing = await Turing.deploy();
    await turing.deployed();
    // A professora (roberta) nao e conta do Hardhat: "personificamos" o endereco dela
    const PROFA = "0x502542668aF09fa7aea52174b9965A7799343Df7";
    await impersonateAccount(PROFA);
    await setBalance(PROFA, ethers.utils.parseEther("10"));
    const profa = await ethers.getSigner(PROFA);
    return { turing, owner, profa, a1, a2, a3, a4, a5, intruso, signers };
  }

  describe("Deploy", function () {
    it("nao emite tokens no deploy (lazy supply)", async function () {
      const { turing, owner } = await loadFixture(deployFixture);
      expect(await turing.totalSupply()).to.equal(0);
      expect(await turing.balanceOf(owner.address)).to.equal(0);
    });

    it("inicializa users e votacao ativa", async function () {
      const { turing, profa, a1 } = await loadFixture(deployFixture);
      expect(await turing.users("roberta")).to.equal(profa.address);
      expect(await turing.users("nome1")).to.equal(a1.address);
      expect(await turing.codinomeOf(a1.address)).to.equal("nome1");
      expect(await turing.voting()).to.equal(true);
      expect(await turing.name()).to.equal("Turing");
    });
  });

  describe("Acesso owner/professora", function () {
    it("owner e professora podem; outros nao", async function () {
      const { turing, profa, a1 } = await loadFixture(deployFixture);
      await turing.votingOff();
      expect(await turing.voting()).to.equal(false);
      await turing.connect(profa).votingOn();
      expect(await turing.voting()).to.equal(true);
      await expect(turing.connect(a1).votingOff()).to.be.revertedWith("Apenas owner ou professora");
      await expect(turing.connect(a1).issueToken("nome2", T(1))).to.be.revertedWith("Apenas owner ou professora");
      await expect(turing.connect(a1).updateUser("x", a1.address)).to.be.revertedWith("Apenas owner ou professora");
    });

    it("issueToken cria Turings para o codinome", async function () {
      const { turing, a2 } = await loadFixture(deployFixture);
      await expect(turing.issueToken("nome2", T(5)))
        .to.emit(turing, "Transfer").withArgs(ethers.constants.AddressZero, a2.address, T(5));
      expect(await turing.balanceOf(a2.address)).to.equal(T(5));
      expect(await turing.totalSupply()).to.equal(T(5));
      await expect(turing.issueToken("ninguem", T(1))).to.be.revertedWith("Codinome nao cadastrado");
    });

    it("updateUser troca o endereco e rejeita codinome vazio", async function () {
      const { turing, a1, intruso } = await loadFixture(deployFixture);
      await expect(turing.updateUser("", intruso.address)).to.be.revertedWith("Codinome vazio");
      await turing.updateUser("nome1", intruso.address);
      expect(await turing.users("nome1")).to.equal(intruso.address);
      expect(await turing.codinomeOf(intruso.address)).to.equal("nome1");
      expect(await turing.codinomeOf(a1.address)).to.equal("");
      await turing.updateUser("novo", a1.address);
      expect(await turing.getCodinomes()).to.include("novo");
    });
  });

  describe("vote", function () {
    it("vota e cria Turings para o votado", async function () {
      const { turing, a1, a2 } = await loadFixture(deployFixture);
      await expect(turing.connect(a1).vote("nome2", T(1.5)))
        .to.emit(turing, "Voted").withArgs("nome1", "nome2", T(1.5));
      expect(await turing.balanceOf(a2.address)).to.equal(T(1.5));
      expect(await turing.hasVote("nome1", "nome2")).to.equal(true);
    });

    it("aplica todos os requires", async function () {
      const { turing, a1, intruso } = await loadFixture(deployFixture);
      await expect(turing.connect(intruso).vote("nome2", T(1))).to.be.revertedWith("Usuario nao autorizado");
      await expect(turing.connect(a1).vote("nome1", T(1))).to.be.revertedWith("Nao pode votar em si mesmo");
      await expect(turing.connect(a1).vote("nome2", 0)).to.be.revertedWith("Quantidade deve ser > 0 e <= 2 Turings");
      await expect(turing.connect(a1).vote("nome2", T(2).add(1))).to.be.revertedWith("Quantidade deve ser > 0 e <= 2 Turings");
      await expect(turing.connect(a1).vote("ninguem", T(1))).to.be.revertedWith("Codinome nao cadastrado");
      await turing.connect(a1).vote("nome2", T(2));
      await expect(turing.connect(a1).vote("nome2", T(1))).to.be.revertedWith("Ja votou nesse codinome");
      await turing.votingOff();
      await expect(turing.connect(a1).vote("nome3", T(1))).to.be.revertedWith("Votacao pausada");
    });

    it("a cada 10 votos o votante ganha 1 Turing", async function () {
      const { turing, owner, a1, signers } = await loadFixture(deployFixture);
      for (let i = 0; i < 12; i++) {
        await turing.updateUser("extra" + i, signers[7 + i].address);
      }
      for (let i = 0; i < 9; i++) await turing.connect(a1).vote("extra" + i, T(1));
      expect(await turing.balanceOf(a1.address)).to.equal(0);
      await turing.connect(a1).vote("extra9", T(1));
      expect(await turing.balanceOf(a1.address)).to.equal(T(1));
      expect(await turing.votesCast("nome1")).to.equal(10);
    });
  });
});
