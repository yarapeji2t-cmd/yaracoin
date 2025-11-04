;; ------------------------------------------------------------
;; YARABIT - SIP-010 Fungible Token
;; ------------------------------------------------------------
;; A minimal SIP-010 compliant fungible token for the Yarabit project.
;; Includes owner-controlled minting and user self-burn.

;; -----------------------
;; Traits
;; -----------------------
(define-trait sip010-ft-trait
  (
    (transfer (uint principal principal (optional (buff 34))) (response bool uint))
    (get-name () (response (string-ascii 32) uint))
    (get-symbol () (response (string-ascii 10) uint))
    (get-decimals () (response uint uint))
    (get-balance-of (principal) (response uint uint))
    (get-total-supply () (response uint uint))
  )
)

;; -----------------------
;; Constants / Errors
;; -----------------------
(define-constant ERR-NOT-AUTHORIZED (err u100))
(define-constant ERR-INSUFFICIENT-BALANCE (err u101))
(define-constant ERR-ZERO-AMOUNT (err u102))
(define-constant ERR-ALREADY-INITIALIZED (err u103))
(define-constant ERR-NOT-INITIALIZED (err u104))

(define-constant TOKEN-NAME "Yarabit")
(define-constant TOKEN-SYMBOL "YBT")
(define-constant TOKEN-DECIMALS u6)

;; -----------------------
;; Data Vars / Maps
;; -----------------------
(define-data-var owner (optional principal) none)
(define-data-var total-supply uint u0)
(define-map balances { who: principal } { amount: uint })

;; -----------------------
;; Private helpers
;; -----------------------
(define-private (get-balance-internal (who principal))
  (default-to u0 (get amount (map-get? balances { who: who })))
)

(define-private (set-balance (who principal) (amount uint))
  (if (is-eq amount u0)
      (begin (map-delete balances { who: who }) amount)
      (begin (map-set balances { who: who } { amount: amount }) amount)
  )
)

(define-private (ensure-owner)
  (match (var-get owner)
    owner-principal (if (is-eq tx-sender owner-principal)
                        (ok true)
                        ERR-NOT-AUTHORIZED)
    ERR-NOT-INITIALIZED
  )
)

;; -----------------------
;; Public functions
;; -----------------------
;; One-time initializer to set the contract owner (deployer should call).
(define-public (initialize)
  (if (is-none (var-get owner))
      (begin (var-set owner (some tx-sender)) (ok true))
      ERR-ALREADY-INITIALIZED))

;; SIP-010 transfer
(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
  (begin
    (asserts! (> amount u0) ERR-ZERO-AMOUNT)
    (asserts! (is-eq sender tx-sender) ERR-NOT-AUTHORIZED)
    (let ((sender-balance (get-balance-internal sender)))
      (asserts! (>= sender-balance amount) ERR-INSUFFICIENT-BALANCE)
      (let ((new-sender (- sender-balance amount))
            (recipient-balance (get-balance-internal recipient)))
        (set-balance sender new-sender)
        (set-balance recipient (+ recipient-balance amount))
        (ok true)
      )
    )
  )
)

;; Owner-only mint
(define-public (mint (amount uint) (recipient principal))
  (begin
    (asserts! (> amount u0) ERR-ZERO-AMOUNT)
    (try! (ensure-owner))
    (let ((rb (get-balance-internal recipient)))
      (set-balance recipient (+ rb amount))
      (var-set total-supply (+ (var-get total-supply) amount))
      (ok true)
    )
  )
)

;; User self-burn
(define-public (burn (amount uint))
  (begin
    (asserts! (> amount u0) ERR-ZERO-AMOUNT)
    (let ((sb (get-balance-internal tx-sender)))
      (asserts! (>= sb amount) ERR-INSUFFICIENT-BALANCE)
      (set-balance tx-sender (- sb amount))
      (var-set total-supply (- (var-get total-supply) amount))
      (ok true)
    )
  )
)

;; -----------------------
;; Read-only functions
;; -----------------------
(define-read-only (get-name)
  (ok TOKEN-NAME)
)

(define-read-only (get-symbol)
  (ok TOKEN-SYMBOL)
)

(define-read-only (get-decimals)
  (ok TOKEN-DECIMALS)
)

(define-read-only (get-balance-of (who principal))
  (ok (get-balance-internal who))
)

(define-read-only (get-total-supply)
  (ok (var-get total-supply))
)
