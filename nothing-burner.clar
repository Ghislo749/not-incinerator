;; Constants

(define-constant ERR-ERROR-UNWRAP u400)
(define-constant ERR-ERROR-TRANSFER u401)
(define-constant ERR-YOU-POOR u402)  ;; for the culture
(define-constant CONTRACT_OWNER tx-sender)


;; Functions

(define-public (burn-nothing (amount uint))
  (if (contract-call? SP32AEEF6WW5Y0NMJ1S8SBSZDAY8R5J32NBZFPKKZ.nope unwrap amount)
      (if (contract-call? SP32AEEF6WW5Y0NMJ1S8SBSZDAY8R5J32NBZFPKKZ.micro-nthng transfer CONTRACT_OWNER.nothing-burner amount)
          (ok true)
          ERR-ERROR-TRANSFER)
      ERR-ERROR-UNWRAP)) 
