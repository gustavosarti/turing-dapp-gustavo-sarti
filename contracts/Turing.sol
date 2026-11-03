// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

/// @title Turing - criptomoeda para votação dos projetos finais
/// @notice Estratégia "Uncapped Lazy Supply": nada é emitido no deploy;
///         os Turings são criados sob demanda (issueToken e vote), sem limite máximo.
contract Turing {
    string public name = "Turing";
    string public symbol = "TUR";
    uint8 public constant decimals = 18; // 1 Turing = 10^18 "saTurings"

    uint256 public totalSupply;
    mapping(address => uint256) private balances;

    address public owner;
    address public professora;

    // Controle de acesso: codinome => endereço autorizado
    mapping(string => address) public users;
    // Endereço => codinome (para identificar quem está votando)
    mapping(address => string) public codinomeOf;
    // Lista de codinomes (o frontend usa para montar o ranking)
    string[] private codinomes;
    mapping(string => bool) private registered;

    // Votação
    bool public voting = true;
    // hasVote[votante][votado] = true se o votante já votou no votado
    mapping(string => mapping(string => bool)) public hasVote;
    // Quantos votos cada codinome já deu
    mapping(string => uint256) public votesCast;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Voted(string voter, string target, uint256 amount);
    event TokenIssued(string codinome, uint256 amount);
    event VotingStatus(bool active);
    event UserUpdated(string codinome, address user);

    modifier onlyOwnerOrProfessora() {
        require(
            msg.sender == owner || msg.sender == professora,
            "Apenas owner ou professora"
        );
        _;
    }

    constructor() {
        owner = msg.sender;

        // ===== TABELA EXEMPLO (usuarios autorizados) =====
        professora = 0x502542668aF09fa7aea52174b9965A7799343Df7;
        _setUser("roberta", 0x502542668aF09fa7aea52174b9965A7799343Df7);
        _setUser("nome1", 0x70997970C51812dc3A010C7d01b50e0d17dc79C8);
        _setUser("nome2", 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC);
        _setUser("nome3", 0x90F79bf6EB2c4f870365E785982E1f101E93b906);
        _setUser("nome4", 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65);
        _setUser("nome5", 0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc);
        // ==================================================
    }

    // ---------------- Leitura ----------------

    function balanceOf(address account) external view returns (uint256) {
        return balances[account];
    }

    /// @notice Lista todos os codinomes cadastrados
    function getCodinomes() external view returns (string[] memory) {
        return codinomes;
    }

    // ---------------- Administração ----------------

    function updateUser(string memory codinome, address user_addr)
        external
        onlyOwnerOrProfessora
    {
        require(bytes(codinome).length > 0, "Codinome vazio");
        _setUser(codinome, user_addr);
    }

    function votingOn() external onlyOwnerOrProfessora {
        voting = true;
        emit VotingStatus(true);
    }

    function votingOff() external onlyOwnerOrProfessora {
        voting = false;
        emit VotingStatus(false);
    }

    function issueToken(string memory codinome, uint256 qtde_de_Turings)
        external
        onlyOwnerOrProfessora
    {
        address to = users[codinome];
        require(to != address(0), "Codinome nao cadastrado");
        _mint(to, qtde_de_Turings);
        emit TokenIssued(codinome, qtde_de_Turings);
    }

    // ---------------- Votação ----------------

    function vote(string memory codinome, uint256 qtde_de_Turings) external {
        require(voting, "Votacao pausada");

        string memory voter = codinomeOf[msg.sender];
        require(bytes(voter).length > 0, "Usuario nao autorizado");

        address target = users[codinome];
        require(target != address(0), "Codinome nao cadastrado");
        require(target != msg.sender, "Nao pode votar em si mesmo");
        require(
            qtde_de_Turings > 0 && qtde_de_Turings <= 2 * 10**decimals,
            "Quantidade deve ser > 0 e <= 2 Turings"
        );
        require(!hasVote[voter][codinome], "Ja votou nesse codinome");

        hasVote[voter][codinome] = true;
        _mint(target, qtde_de_Turings);
        emit Voted(voter, codinome, qtde_de_Turings);

        // A cada 10 votos, o votante ganha 1 Turing
        votesCast[voter] += 1;
        if (votesCast[voter] % 10 == 0) {
            _mint(msg.sender, 10**decimals);
        }
    }

    // ---------------- Internas ----------------

    function _setUser(string memory codinome, address user_addr) internal {
        if (!registered[codinome]) {
            registered[codinome] = true;
            codinomes.push(codinome); // codinome novo
        }
        address old = users[codinome];
        if (old != address(0)) {
            delete codinomeOf[old];
        }
        users[codinome] = user_addr;
        if (user_addr != address(0)) {
            codinomeOf[user_addr] = codinome;
        }
        emit UserUpdated(codinome, user_addr);
    }

    function _mint(address to, uint256 amount) internal {
        totalSupply += amount;
        balances[to] += amount;
        emit Transfer(address(0), to, amount);
    }
}
