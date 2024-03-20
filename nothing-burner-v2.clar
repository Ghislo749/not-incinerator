;; Constants

(define-constant ERR-ERROR u401)
(define-constant ERR-YOU-POOR u402)  ;; for the culture
(define-constant CONTRACT_OWNER tx-sender)


;; Functions

(define-read-only (format-number-with-commas (number uint))  ;; Returns formatted amount with commas every three digits
  (let ((number-string (uint-to-string number))
        (formatted-string ""))
    (foldl
      (lambda (char acc)
        (if (= (strlen formatted-string) 3)
            (begin
              (setq formatted-string "")
              (setq acc (concat acc ",")))
            acc)
        (setq formatted-string (concat formatted-string (str char)))
        (concat acc (str char)))
      "" (reverse number-string))))


(define-read-only (create-burn-text (amount uint))   ;; Returns text string for the NFT
  (concat "Burned " (format-number-with-commas amount) " at block " (uint-to-string (block-height))))


(define-public (burn-nothing (amount uint)) 
  (let ((unwrap-success (contract-call? SP32AEEF6WW5Y0NMJ1S8SBSZDAY8R5J32NBZFPKKZ.nope unwrap amount))
        (transfer-success (contract-call? SP32AEEF6WW5Y0NMJ1S8SBSZDAY8R5J32NBZFPKKZ.micro-nthng transfer CONTRACT_OWNER.nothing-burner amount)))
    (if (and unwrap-success transfer-success)
        (mint-nft amount)
        (err ERR-ERROR))
  )
)


(define-private (mint-nft (amount uint))    ;; Function to mint the NFT
  
 
  ;; The idea is to generate an nft using the text returned by (create-burn-text amount) and transfer it to the tx-sender


  
) 
