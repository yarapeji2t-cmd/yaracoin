;; title: yaracoin
;; version: 1.0.0
;; summary: A decentralized cryptocurrency token built on Stacks blockchain
;; description: YaraCoin (YARA) is a fungible token with standard transfer, mint, and burn functionality

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-insufficient-balance (err u101))
(define-constant err-invalid-amount (err u102))
(define-constant err-unauthorized (err u103))
(define-constant err-already-minted (err u104))

;; Token configuration
(define-constant token-name "YaraCoin")
(define-constant token-symbol "YARA")
(define-constant token-decimals u6)
(define-constant max-supply u1000000000000) ;; 1 billion tokens with 6 decimals

;; Data variables
(define-data-var total-supply uint u0)
(define-data-var token-uri (optional (string-ascii 256)) none)
(define-data-var minting-enabled bool true)

;; Data maps
(define-map balances principal uint)
(define-map allowances { owner: principal, spender: principal } uint)
(define-map authorized-minters principal bool)

;; Private functions
(define-private (get-balance-or-default (account principal))
  (default-to u0 (map-get? balances account)))

(define-private (get-allowance-or-default (owner principal) (spender principal))
  (default-to u0 (map-get? allowances { owner: owner, spender: spender })))

;; Read-only functions
(define-read-only (get-name)
  (ok token-name))

(define-read-only (get-symbol)
  (ok token-symbol))

(define-read-only (get-decimals)
  (ok token-decimals))

(define-read-only (get-balance (account principal))
  (ok (get-balance-or-default account)))

(define-read-only (get-total-supply)
  (ok (var-get total-supply)))

(define-read-only (get-max-supply)
  (ok max-supply))

(define-read-only (get-token-uri)
  (ok (var-get token-uri)))

(define-read-only (get-allowance (owner principal) (spender principal))
  (ok (get-allowance-or-default owner spender)))

(define-read-only (is-minting-enabled)
  (ok (var-get minting-enabled)))

(define-read-only (is-authorized-minter (account principal))
  (ok (default-to false (map-get? authorized-minters account))))

;; Public functions
(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
  (begin
    (asserts! (or (is-eq tx-sender sender) (> (get-allowance-or-default sender tx-sender) u0)) err-unauthorized)
    (asserts! (> amount u0) err-invalid-amount)
    (asserts! (>= (get-balance-or-default sender) amount) err-insufficient-balance)
    
    ;; Update balances
    (map-set balances sender (- (get-balance-or-default sender) amount))
    (map-set balances recipient (+ (get-balance-or-default recipient) amount))
    
    ;; Update allowance if spending on behalf of someone else
    (if (not (is-eq tx-sender sender))
      (map-set allowances 
        { owner: sender, spender: tx-sender }
        (- (get-allowance-or-default sender tx-sender) amount))
      true)
    
    (print { 
      event: "transfer",
      sender: sender,
      recipient: recipient,
      amount: amount,
      memo: memo
    })
    (ok true)))

(define-public (mint (amount uint) (recipient principal))
  (begin
    (asserts! (or (is-eq tx-sender contract-owner) 
                  (default-to false (map-get? authorized-minters tx-sender))) err-unauthorized)
    (asserts! (var-get minting-enabled) err-already-minted)
    (asserts! (> amount u0) err-invalid-amount)
    (asserts! (<= (+ (var-get total-supply) amount) max-supply) err-invalid-amount)
    
    ;; Update total supply and recipient balance
    (var-set total-supply (+ (var-get total-supply) amount))
    (map-set balances recipient (+ (get-balance-or-default recipient) amount))
    
    (print {
      event: "mint",
      recipient: recipient,
      amount: amount,
      total-supply: (var-get total-supply)
    })
    (ok true)))

(define-public (burn (amount uint))
  (begin
    (asserts! (> amount u0) err-invalid-amount)
    (asserts! (>= (get-balance-or-default tx-sender) amount) err-insufficient-balance)
    
    ;; Update total supply and sender balance
    (var-set total-supply (- (var-get total-supply) amount))
    (map-set balances tx-sender (- (get-balance-or-default tx-sender) amount))
    
    (print {
      event: "burn",
      burner: tx-sender,
      amount: amount,
      total-supply: (var-get total-supply)
    })
    (ok true)))

(define-public (approve (spender principal) (amount uint))
  (begin
    (map-set allowances { owner: tx-sender, spender: spender } amount)
    (print {
      event: "approve",
      owner: tx-sender,
      spender: spender,
      amount: amount
    })
    (ok true)))

(define-public (transfer-from (sender principal) (recipient principal) (amount uint) (memo (optional (buff 34))))
  (let ((allowance (get-allowance-or-default sender tx-sender)))
    (asserts! (>= allowance amount) err-unauthorized)
    (try! (transfer amount sender recipient memo))
    (ok true)))

;; Administrative functions
(define-public (set-token-uri (uri (optional (string-ascii 256))))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (var-set token-uri uri)
    (ok true)))

(define-public (set-minting-enabled (enabled bool))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (var-set minting-enabled enabled)
    (ok true)))

(define-public (add-authorized-minter (minter principal))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (map-set authorized-minters minter true)
    (ok true)))

(define-public (remove-authorized-minter (minter principal))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (map-delete authorized-minters minter)
    (ok true)))

;; Initialize contract with initial mint to contract owner
(begin
  (try! (mint u100000000000 contract-owner)) ;; Mint 100,000 YARA to contract owner
  (print "YaraCoin contract initialized"))

