# YaraCoin (YARA) Smart Contract

YaraCoin is a decentralized cryptocurrency token built on the Stacks blockchain using Clarity smart contracts. This project provides a complete implementation of a fungible token with standard transfer, mint, and burn functionality.

## 📋 Table of Contents

- [Features](#features)
- [Token Details](#token-details)
- [Installation](#installation)
- [Usage](#usage)
- [Contract Functions](#contract-functions)
- [Testing](#testing)
- [Deployment](#deployment)
- [Security](#security)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

- **Standard Token Functionality**: Transfer, mint, burn, approve, and allowance mechanisms
- **Administrative Controls**: Owner-only functions for contract management
- **Authorized Minters**: Ability to delegate minting permissions to other addresses
- **Minting Control**: Can enable/disable minting permanently
- **Maximum Supply Cap**: Hard-coded maximum supply of 1 billion tokens
- **Event Logging**: Comprehensive event emissions for all major operations
- **Security**: Built-in checks for authorization, sufficient balances, and valid amounts

## 🪙 Token Details

- **Name**: YaraCoin
- **Symbol**: YARA
- **Decimals**: 6
- **Max Supply**: 1,000,000,000.000000 YARA (1 billion tokens with 6 decimals)
- **Initial Supply**: 100,000.000000 YARA (minted to contract deployer)

## 🚀 Installation

### Prerequisites

- [Clarinet CLI](https://docs.hiro.so/clarinet/installation) (v3.7.0 or later)
- [Node.js](https://nodejs.org/) (v18 or later)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd yaracoin-contract
```

2. Install dependencies:
```bash
npm install
```

3. Check contract syntax:
```bash
clarinet check
```

## 🔧 Usage

### Development Environment

Start the local development environment:
```bash
clarinet console
```

### Basic Operations

#### Get Token Information
```bash
# Get token name
(contract-call? .yaracoin get-name)

# Get token symbol
(contract-call? .yaracoin get-symbol)

# Get decimals
(contract-call? .yaracoin get-decimals)

# Get total supply
(contract-call? .yaracoin get-total-supply)
```

#### Check Balances
```bash
# Check balance of an address
(contract-call? .yaracoin get-balance 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)
```

#### Transfer Tokens
```bash
# Transfer tokens (amount, sender, recipient, memo)
(contract-call? .yaracoin transfer u1000000 tx-sender 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM none)
```

#### Approve Allowances
```bash
# Approve spending allowance
(contract-call? .yaracoin approve 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM u5000000)

# Check allowance
(contract-call? .yaracoin get-allowance tx-sender 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)
```

## 📖 Contract Functions

### Read-Only Functions

| Function | Description | Parameters | Returns |
|----------|-------------|------------|---------|
| `get-name` | Returns token name | None | `(ok "YaraCoin")` |
| `get-symbol` | Returns token symbol | None | `(ok "YARA")` |
| `get-decimals` | Returns decimal places | None | `(ok u6)` |
| `get-balance` | Returns balance of account | `account: principal` | `(ok uint)` |
| `get-total-supply` | Returns total supply | None | `(ok uint)` |
| `get-max-supply` | Returns maximum supply | None | `(ok uint)` |
| `get-token-uri` | Returns token URI | None | `(ok (optional string))` |
| `get-allowance` | Returns allowance amount | `owner: principal, spender: principal` | `(ok uint)` |
| `is-minting-enabled` | Returns minting status | None | `(ok bool)` |
| `is-authorized-minter` | Checks if address can mint | `account: principal` | `(ok bool)` |

### Public Functions

| Function | Description | Parameters | Access |
|----------|-------------|------------|--------|
| `transfer` | Transfer tokens | `amount: uint, sender: principal, recipient: principal, memo: (optional buff 34)` | Token holder or approved spender |
| `mint` | Mint new tokens | `amount: uint, recipient: principal` | Owner or authorized minter |
| `burn` | Burn own tokens | `amount: uint` | Token holder |
| `approve` | Set spending allowance | `spender: principal, amount: uint` | Token holder |
| `transfer-from` | Transfer using allowance | `sender: principal, recipient: principal, amount: uint, memo: (optional buff 34)` | Approved spender |
| `set-token-uri` | Set token metadata URI | `uri: (optional string-ascii 256)` | Owner only |
| `set-minting-enabled` | Enable/disable minting | `enabled: bool` | Owner only |
| `add-authorized-minter` | Add minting permission | `minter: principal` | Owner only |
| `remove-authorized-minter` | Remove minting permission | `minter: principal` | Owner only |

### Error Codes

| Code | Constant | Description |
|------|----------|-------------|
| `u100` | `err-owner-only` | Function can only be called by contract owner |
| `u101` | `err-insufficient-balance` | Sender has insufficient token balance |
| `u102` | `err-invalid-amount` | Invalid amount (zero or exceeds max supply) |
| `u103` | `err-unauthorized` | Caller is not authorized for this operation |
| `u104` | `err-already-minted` | Minting has been permanently disabled |

## 🧪 Testing

Run the comprehensive test suite:

```bash
npm test
```

The test suite covers:
- Contract initialization
- Token metadata verification
- Transfer functionality (valid and invalid scenarios)
- Approval and allowance mechanisms
- Minting functionality (authorized and unauthorized)
- Burning functionality
- Administrative functions
- Error handling

### Test Coverage

- ✅ Contract initialization with correct metadata
- ✅ Initial token minting to deployer
- ✅ Valid and invalid transfers
- ✅ Authorization checks
- ✅ Allowance and approval mechanisms
- ✅ Minting by owner and authorized minters
- ✅ Burning functionality
- ✅ Administrative controls
- ✅ Error conditions and edge cases

## 🚀 Deployment

### Local Deployment (Devnet)

1. Start the local devnet:
```bash
clarinet devnet start
```

2. Deploy the contract:
```bash
clarinet devnet deploy
```

### Testnet Deployment

1. Configure your testnet settings in `settings/Testnet.toml`

2. Deploy to testnet:
```bash
clarinet publish --testnet
```

### Mainnet Deployment

1. Configure your mainnet settings in `settings/Mainnet.toml`

2. Deploy to mainnet:
```bash
clarinet publish --mainnet
```

## 🔒 Security

### Built-in Security Features

- **Authorization Checks**: All administrative functions require owner permission
- **Balance Verification**: Transfers check for sufficient balance before execution
- **Input Validation**: All functions validate input parameters
- **Overflow Protection**: Uses Clarity's built-in safe arithmetic
- **Access Control**: Minting permissions can be granted and revoked

### Security Considerations

- The contract owner has significant control over token functionality
- Once minting is disabled, it cannot be re-enabled
- Maximum supply is hard-coded and cannot be changed
- Consider using a multi-signature wallet for the owner address in production

### Auditing

Before deploying to mainnet, consider:
- Professional smart contract audit
- Comprehensive testing on testnet
- Community review of the contract code
- Formal verification of critical functions

## 📁 Project Structure

```
yaracoin-contract/
├── contracts/
│   └── yaracoin.clar          # Main contract implementation
├── tests/
│   └── yaracoin.test.ts       # Comprehensive test suite
├── settings/
│   ├── Devnet.toml           # Local development configuration
│   ├── Testnet.toml          # Testnet configuration
│   └── Mainnet.toml          # Mainnet configuration
├── Clarinet.toml             # Project configuration
├── package.json              # Node.js dependencies
├── tsconfig.json             # TypeScript configuration
├── vitest.config.js          # Test configuration
└── README.md                 # This file
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow Clarity best practices
- Add tests for new functionality
- Update documentation as needed
- Ensure all tests pass before submitting PR

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Stacks Blockchain](https://www.stacks.co/) for the platform
- [Clarinet](https://github.com/hirosystems/clarinet) for development tools
- [Hiro Systems](https://www.hiro.so/) for documentation and resources

## 📞 Support

For questions, issues, or contributions:
- Open an issue on GitHub
- Join the Stacks community Discord
- Check the [Stacks documentation](https://docs.stacks.co/)

---

**⚠️ Disclaimer**: This is experimental software. Use at your own risk. Always test thoroughly before deploying to mainnet.