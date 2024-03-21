;; Constants ;;
(define-constant ERR-ERROR-UNWRAP u400)
(define-constant ERR-ERROR-TRANSFER u401)
(define-constant ERR-YOU-POOR u402)  ;; for the culture
(define-constant CONTRACT_OWNER tx-sender)

;; Public variables ;;
(define-data-var nothing-burner-amount uint u0)

;; Functions ;;
(define-read-only (get-nothing-burner-amount) 
    (ok (var-get nothing-burner-amount)))

(define-private (increase-nothing-burner-amount (amount uint))
    (var-set nothing-burner-amount (+ (var-get nothing-burner-amount) amount)))

(define-public (burn-nothing (amount uint))
    (begin 
        (unwrap! (contract-call? 'SP32AEEF6WW5Y0NMJ1S8SBSZDAY8R5J32NBZFPKKZ.nope unwrap amount) (err ERR-ERROR-UNWRAP))
        (unwrap! (contract-call? 'SP32AEEF6WW5Y0NMJ1S8SBSZDAY8R5J32NBZFPKKZ.micro-nthng transfer (as-contract tx-sender) amount) (err ERR-ERROR-TRANSFER))
        (increase-nothing-burner-amount amount)
        (ok true)))
