# YaraCoin Deployment Guide

This guide walks you through deploying the YaraCoin smart contract to different Stacks networks.

## Prerequisites

- Clarinet CLI installed
- STX tokens for gas fees (testnet/mainnet)
- A Stacks wallet with a configured private key

## Configuration Files

### Devnet (Local Development)

File: `settings/Devnet.toml`

```toml
[network]
name = "devnet"
deployment_fee_rate = 10

[[network.accounts]]
label = "deployer"
mnemonic = "twice kind fence tip hidden tilt action fragile skin nothing glory cousin green tomorrow spring wrist shed math olympic multiply hip blue scout claw"
balance = 100000000000000

# Add more accounts as needed
```

### Testnet

File: `settings/Testnet.toml`

```toml
[network]
name = "testnet"
stacks_node_rpc_address = "https://api.testnet.hiro.so"
deployment_fee_rate = 10

# Configure with your testnet account
[[network.accounts]]
label = "deployer"
mnemonic = "your testnet mnemonic here"
```

### Mainnet

File: `settings/Mainnet.toml`

```toml
[network]
name = "mainnet"
stacks_node_rpc_address = "https://api.hiro.so"
deployment_fee_rate = 10

# Configure with your mainnet account
[[network.accounts]]
label = "deployer"
mnemonic = "your mainnet mnemonic here"
```

## Deployment Steps

### 1. Local Development (Devnet)

```bash
# Start local devnet
clarinet devnet start

# In another terminal, deploy contracts
clarinet devnet deploy
```

### 2. Testnet Deployment

```bash
# Make sure you have STX in your testnet wallet
# Deploy to testnet
clarinet publish --testnet
```

### 3. Mainnet Deployment

⚠️ **IMPORTANT**: Before mainnet deployment:
- Thoroughly test on devnet and testnet
- Get a professional security audit
- Have a plan for token distribution
- Ensure you understand the gas costs

```bash
# Deploy to mainnet (requires STX for gas)
clarinet publish --mainnet
```

## Post-Deployment Tasks

### 1. Verify Contract

After deployment, verify your contract on the appropriate Stacks explorer:
- Testnet: https://explorer.hiro.so/transactions?chain=testnet
- Mainnet: https://explorer.hiro.so/

### 2. Initial Configuration

If needed, configure the contract after deployment:

```clarity
;; Set token URI (optional)
(contract-call? .yaracoin set-token-uri (some "https://your-domain.com/yaracoin-metadata.json"))

;; Add additional authorized minters if needed
(contract-call? .yaracoin add-authorized-minter 'ST1EXAMPLE...)

;; Disable minting if required (irreversible!)
(contract-call? .yaracoin set-minting-enabled false)
```

### 3. Token Distribution

Plan how you'll distribute the initial tokens:
- Airdrops
- Public sale
- Liquidity provision
- Team allocation

## Gas Costs Estimation

Typical gas costs on mainnet:
- Contract deployment: ~0.1 - 1 STX
- Token transfer: ~0.0001 - 0.001 STX
- Minting: ~0.0001 - 0.001 STX
- Administrative functions: ~0.0001 - 0.001 STX

*Note: Gas costs vary based on network congestion*

## Security Checklist

Before mainnet deployment:

- [ ] Contract audited by professionals
- [ ] All tests passing
- [ ] Maximum supply verified
- [ ] Owner controls documented
- [ ] Deployment keys secured (consider multisig)
- [ ] Community review completed
- [ ] Emergency response plan ready

## Troubleshooting

### Common Issues

**"Insufficient funds" error:**
- Ensure your deployment account has enough STX for gas fees

**"Contract already exists" error:**
- Contract names must be unique per deployer address
- Use a different contract name or deployer address

**"Invalid syntax" error:**
- Run `clarinet check` to verify contract syntax
- Check for compatibility with the target network

### Getting Help

- Stacks documentation: https://docs.stacks.co/
- Clarinet documentation: https://docs.hiro.so/clarinet/
- Stacks Discord: https://discord.gg/stacks
- GitHub issues: Create an issue in this repository

## Network Information

### Testnet
- Network ID: Testnet
- Stacks API: https://api.testnet.hiro.so
- Explorer: https://explorer.hiro.so/?chain=testnet
- Faucet: https://explorer.hiro.so/sandbox/faucet?chain=testnet

### Mainnet
- Network ID: Mainnet
- Stacks API: https://api.hiro.so
- Explorer: https://explorer.hiro.so/

---

**Note**: Always test thoroughly before deploying to mainnet. Smart contracts are immutable once deployed!