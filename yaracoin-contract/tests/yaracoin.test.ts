import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;
const address3 = accounts.get("wallet_3")!;
const deployer = accounts.get("deployer")!;

describe("YaraCoin Contract Tests", () => {
  beforeEach(() => {
    // Contract is automatically deployed by Clarinet
  });

  describe("Contract Initialization", () => {
    it("should initialize with correct token metadata", () => {
      const name = simnet.callReadOnlyFn("yaracoin", "get-name", [], address1);
      expect(name.result).toBeOk(Cl.stringAscii("YaraCoin"));

      const symbol = simnet.callReadOnlyFn("yaracoin", "get-symbol", [], address1);
      expect(symbol.result).toBeOk(Cl.stringAscii("YARA"));

      const decimals = simnet.callReadOnlyFn("yaracoin", "get-decimals", [], address1);
      expect(decimals.result).toBeOk(Cl.uint(6));

      const maxSupply = simnet.callReadOnlyFn("yaracoin", "get-max-supply", [], address1);
      expect(maxSupply.result).toBeOk(Cl.uint(1000000000000));
    });

    it("should have initial mint to deployer", () => {
      const balance = simnet.callReadOnlyFn("yaracoin", "get-balance", [Cl.principal(deployer)], address1);
      expect(balance.result).toBeOk(Cl.uint(100000000000));

      const totalSupply = simnet.callReadOnlyFn("yaracoin", "get-total-supply", [], address1);
      expect(totalSupply.result).toBeOk(Cl.uint(100000000000));
    });

    it("should have minting enabled by default", () => {
      const mintingEnabled = simnet.callReadOnlyFn("yaracoin", "is-minting-enabled", [], address1);
      expect(mintingEnabled.result).toBeOk(Cl.bool(true));
    });
  });

  describe("Transfer Functionality", () => {
    it("should allow valid transfers", () => {
      const transferAmount = 1000000; // 1 YARA
      const response = simnet.callPublicFn(
        "yaracoin",
        "transfer",
        [Cl.uint(transferAmount), Cl.principal(deployer), Cl.principal(address1), Cl.none()],
        deployer
      );
      expect(response.result).toBeOk(Cl.bool(true));

      // Check balances
      const deployerBalance = simnet.callReadOnlyFn("yaracoin", "get-balance", [Cl.principal(deployer)], address1);
      expect(deployerBalance.result).toBeOk(Cl.uint(100000000000 - transferAmount));

      const address1Balance = simnet.callReadOnlyFn("yaracoin", "get-balance", [Cl.principal(address1)], address1);
      expect(address1Balance.result).toBeOk(Cl.uint(transferAmount));
    });

    it("should reject transfers with insufficient balance", () => {
      const transferAmount = 100000000001; // More than deployer has
      const response = simnet.callPublicFn(
        "yaracoin",
        "transfer",
        [Cl.uint(transferAmount), Cl.principal(deployer), Cl.principal(address1), Cl.none()],
        deployer
      );
      expect(response.result).toBeErr(Cl.uint(101)); // err-insufficient-balance
    });

    it("should reject zero amount transfers", () => {
      const response = simnet.callPublicFn(
        "yaracoin",
        "transfer",
        [Cl.uint(0), Cl.principal(deployer), Cl.principal(address1), Cl.none()],
        deployer
      );
      expect(response.result).toBeErr(Cl.uint(102)); // err-invalid-amount
    });

    it("should reject unauthorized transfers", () => {
      const transferAmount = 1000000;
      const response = simnet.callPublicFn(
        "yaracoin",
        "transfer",
        [Cl.uint(transferAmount), Cl.principal(deployer), Cl.principal(address2), Cl.none()],
        address1 // address1 trying to spend deployer's tokens without allowance
      );
      expect(response.result).toBeErr(Cl.uint(103)); // err-unauthorized
    });
  });

  describe("Approval and Allowance", () => {
    it("should allow setting and getting allowances", () => {
      const allowanceAmount = 5000000; // 5 YARA
      
      // Set allowance
      const approveResponse = simnet.callPublicFn(
        "yaracoin",
        "approve",
        [Cl.principal(address1), Cl.uint(allowanceAmount)],
        deployer
      );
      expect(approveResponse.result).toBeOk(Cl.bool(true));

      // Check allowance
      const allowance = simnet.callReadOnlyFn(
        "yaracoin",
        "get-allowance",
        [Cl.principal(deployer), Cl.principal(address1)],
        address2
      );
      expect(allowance.result).toBeOk(Cl.uint(allowanceAmount));
    });

    it("should allow transfer-from with valid allowance", () => {
      const allowanceAmount = 5000000;
      const transferAmount = 2000000;
      
      // Set allowance
      simnet.callPublicFn(
        "yaracoin",
        "approve",
        [Cl.principal(address1), Cl.uint(allowanceAmount)],
        deployer
      );

      // Transfer using allowance
      const response = simnet.callPublicFn(
        "yaracoin",
        "transfer-from",
        [Cl.principal(deployer), Cl.principal(address2), Cl.uint(transferAmount), Cl.none()],
        address1
      );
      expect(response.result).toBeOk(Cl.bool(true));

      // Check balances
      const address2Balance = simnet.callReadOnlyFn("yaracoin", "get-balance", [Cl.principal(address2)], address1);
      expect(address2Balance.result).toBeOk(Cl.uint(transferAmount));

      // Check remaining allowance
      const remainingAllowance = simnet.callReadOnlyFn(
        "yaracoin",
        "get-allowance",
        [Cl.principal(deployer), Cl.principal(address1)],
        address2
      );
      expect(remainingAllowance.result).toBeOk(Cl.uint(allowanceAmount - transferAmount));
    });

    it("should reject transfer-from with insufficient allowance", () => {
      const allowanceAmount = 1000000;
      const transferAmount = 2000000; // More than allowed
      
      // Set allowance
      simnet.callPublicFn(
        "yaracoin",
        "approve",
        [Cl.principal(address1), Cl.uint(allowanceAmount)],
        deployer
      );

      // Attempt transfer using more than allowance
      const response = simnet.callPublicFn(
        "yaracoin",
        "transfer-from",
        [Cl.principal(deployer), Cl.principal(address2), Cl.uint(transferAmount), Cl.none()],
        address1
      );
      expect(response.result).toBeErr(Cl.uint(103)); // err-unauthorized
    });
  });

  describe("Minting Functionality", () => {
    it("should allow contract owner to mint tokens", () => {
      const mintAmount = 10000000; // 10 YARA
      const response = simnet.callPublicFn(
        "yaracoin",
        "mint",
        [Cl.uint(mintAmount), Cl.principal(address1)],
        deployer
      );
      expect(response.result).toBeOk(Cl.bool(true));

      // Check recipient balance
      const balance = simnet.callReadOnlyFn("yaracoin", "get-balance", [Cl.principal(address1)], address1);
      expect(balance.result).toBeOk(Cl.uint(mintAmount));

      // Check total supply
      const totalSupply = simnet.callReadOnlyFn("yaracoin", "get-total-supply", [], address1);
      expect(totalSupply.result).toBeOk(Cl.uint(100000000000 + mintAmount));
    });

    it("should reject minting by non-owner", () => {
      const mintAmount = 10000000;
      const response = simnet.callPublicFn(
        "yaracoin",
        "mint",
        [Cl.uint(mintAmount), Cl.principal(address1)],
        address1 // Non-owner trying to mint
      );
      expect(response.result).toBeErr(Cl.uint(103)); // err-unauthorized
    });

    it("should reject minting zero amount", () => {
      const response = simnet.callPublicFn(
        "yaracoin",
        "mint",
        [Cl.uint(0), Cl.principal(address1)],
        deployer
      );
      expect(response.result).toBeErr(Cl.uint(102)); // err-invalid-amount
    });
  });

  describe("Burning Functionality", () => {
    it("should allow burning own tokens", () => {
      const burnAmount = 5000000; // 5 YARA
      const response = simnet.callPublicFn(
        "yaracoin",
        "burn",
        [Cl.uint(burnAmount)],
        deployer
      );
      expect(response.result).toBeOk(Cl.bool(true));

      // Check deployer balance
      const balance = simnet.callReadOnlyFn("yaracoin", "get-balance", [Cl.principal(deployer)], address1);
      expect(balance.result).toBeOk(Cl.uint(100000000000 - burnAmount));

      // Check total supply
      const totalSupply = simnet.callReadOnlyFn("yaracoin", "get-total-supply", [], address1);
      expect(totalSupply.result).toBeOk(Cl.uint(100000000000 - burnAmount));
    });

    it("should reject burning more than balance", () => {
      const excessiveBurnAmount = 100000000001; // More than deployer has
      const response = simnet.callPublicFn(
        "yaracoin",
        "burn",
        [Cl.uint(excessiveBurnAmount)],
        deployer
      );
      expect(response.result).toBeErr(Cl.uint(101)); // err-insufficient-balance
    });

    it("should reject burning zero amount", () => {
      const response = simnet.callPublicFn(
        "yaracoin",
        "burn",
        [Cl.uint(0)],
        deployer
      );
      expect(response.result).toBeErr(Cl.uint(102)); // err-invalid-amount
    });
  });

  describe("Administrative Functions", () => {
    it("should allow owner to set token URI", () => {
      const tokenUri = "https://yaracoin.com/metadata";
      const response = simnet.callPublicFn(
        "yaracoin",
        "set-token-uri",
        [Cl.some(Cl.stringAscii(tokenUri))],
        deployer
      );
      expect(response.result).toBeOk(Cl.bool(true));

      // Check token URI
      const uri = simnet.callReadOnlyFn("yaracoin", "get-token-uri", [], address1);
      expect(uri.result).toBeOk(Cl.some(Cl.stringAscii(tokenUri)));
    });

    it("should allow owner to disable minting", () => {
      const response = simnet.callPublicFn(
        "yaracoin",
        "set-minting-enabled",
        [Cl.bool(false)],
        deployer
      );
      expect(response.result).toBeOk(Cl.bool(true));

      // Check minting status
      const mintingEnabled = simnet.callReadOnlyFn("yaracoin", "is-minting-enabled", [], address1);
      expect(mintingEnabled.result).toBeOk(Cl.bool(false));

      // Try to mint (should fail)
      const mintResponse = simnet.callPublicFn(
        "yaracoin",
        "mint",
        [Cl.uint(1000000), Cl.principal(address1)],
        deployer
      );
      expect(mintResponse.result).toBeErr(Cl.uint(104)); // err-already-minted
    });

    it("should allow owner to manage authorized minters", () => {
      // Add authorized minter
      const addResponse = simnet.callPublicFn(
        "yaracoin",
        "add-authorized-minter",
        [Cl.principal(address1)],
        deployer
      );
      expect(addResponse.result).toBeOk(Cl.bool(true));

      // Check if authorized
      const isAuthorized = simnet.callReadOnlyFn(
        "yaracoin",
        "is-authorized-minter",
        [Cl.principal(address1)],
        address2
      );
      expect(isAuthorized.result).toBeOk(Cl.bool(true));

      // Authorized minter should be able to mint
      const mintResponse = simnet.callPublicFn(
        "yaracoin",
        "mint",
        [Cl.uint(1000000), Cl.principal(address2)],
        address1
      );
      expect(mintResponse.result).toBeOk(Cl.bool(true));

      // Remove authorized minter
      const removeResponse = simnet.callPublicFn(
        "yaracoin",
        "remove-authorized-minter",
        [Cl.principal(address1)],
        deployer
      );
      expect(removeResponse.result).toBeOk(Cl.bool(true));

      // Check if no longer authorized
      const isNotAuthorized = simnet.callReadOnlyFn(
        "yaracoin",
        "is-authorized-minter",
        [Cl.principal(address1)],
        address2
      );
      expect(isNotAuthorized.result).toBeOk(Cl.bool(false));
    });

    it("should reject administrative functions from non-owner", () => {
      // Non-owner trying to set token URI
      const uriResponse = simnet.callPublicFn(
        "yaracoin",
        "set-token-uri",
        [Cl.some(Cl.stringAscii("https://fake.com"))],
        address1
      );
      expect(uriResponse.result).toBeErr(Cl.uint(100)); // err-owner-only

      // Non-owner trying to disable minting
      const mintingResponse = simnet.callPublicFn(
        "yaracoin",
        "set-minting-enabled",
        [Cl.bool(false)],
        address1
      );
      expect(mintingResponse.result).toBeErr(Cl.uint(100)); // err-owner-only

      // Non-owner trying to add authorized minter
      const addMinterResponse = simnet.callPublicFn(
        "yaracoin",
        "add-authorized-minter",
        [Cl.principal(address2)],
        address1
      );
      expect(addMinterResponse.result).toBeErr(Cl.uint(100)); // err-owner-only
    });
  });
});
