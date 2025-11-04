# Yarabit Smart Contract (Clarity + Clarinet)

A SIP-010 compliant fungible token (YBT) for the Yarabit project, built with Clarinet.

## Features
- SIP-010 functions: `transfer`, `get-name`, `get-symbol`, `get-decimals`, `get-balance-of`, `get-total-supply`
- Owner-controlled `mint`
- User `burn`
- One-time `initialize` to set the contract owner

## Prerequisites
- Clarinet installed
  - Via install script (recommended):
    - bash -lc "curl -fsSL https://get.hiro.so/clarinet/install.sh | bash"
  - Or via npm:
    - npm install -g @hirosystems/clarinet
  - Verify:
    - clarinet --version

## Project Structure
- Clarinet.toml
- contracts/yarabit.clar
- settings/
- tests/

## Build and Check
- From this directory:
  - clarinet check

## Initialize Owner (one-time)
- After deploying (or in Clarinet console), set the owner to the caller:
  - clarinet console
    - (contract-call? .yarabit initialize)

## Mint, Transfer, Burn (examples in console)
- Mint (owner only):
  - (contract-call? .yarabit mint u1000 'ST3...RECIPIENT)
- Transfer (sender signs):
  - (contract-call? .yarabit transfer u100 'ST3...SENDER 'ST3...RECIP (some 0x))
- Burn (caller burns own tokens):
  - (contract-call? .yarabit burn u50)

## Read-only Queries
- (contract-call? .yarabit get-name)
- (contract-call? .yarabit get-symbol)
- (contract-call? .yarabit get-decimals)
- (contract-call? .yarabit get-total-supply)
- (contract-call? .yarabit get-balance-of 'ST3...ADDR)

## Notes
- Decimals: 6 (YBT has 6 fractional digits)
- Errors:
  - u100: not authorized
  - u101: insufficient balance
  - u102: zero amount
  - u103: already initialized
  - u104: not initialized
