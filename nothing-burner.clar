;; Constants ;;
(define-constant ERR-ERROR-UNWRAP u400)
(define-constant ERR-ERROR-TRANSFER u401)
(define-constant ERR-YOU-POOR u402)  ;; for the culture
(define-constant CONTRACT_OWNER tx-sender)

;; Public variables ;;
(define-data-var nothing-burner-amount (uint 0))

;; Functions ;;
(define-read-only (get-nothing-burner-amount)
  nothing-burner-amount)

(define-private (update-nothing-burner-amount (amount uint))
  (set! nothing-burner-amount (+ nothing-burner-amount amount))
  (ok true))


(define-public (burn-nothing (amount uint))
  (if (contract-call? SP32AEEF6WW5Y0NMJ1S8SBSZDAY8R5J32NBZFPKKZ.nope unwrap amount)
      (if (contract-call? SP32AEEF6WW5Y0NMJ1S8SBSZDAY8R5J32NBZFPKKZ.micro-nthng transfer CONTRACT_OWNER.nothing-burner amount)
          (update-nothing-burner-amount amount)  
          ERR-ERROR-TRANSFER)
      ERR-ERROR-UNWRAP))
