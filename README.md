# Cipher CV — Encrypted Labor Matching Protocol

> Privacy-by-design job matching powered by Fully Homomorphic Encryption on Fhenix.

---

## What Is Cipher CV?

Cipher CV is a decentralized labor market where candidates and employers match **without ever revealing their data**. Salary expectations, experience, and identity are encrypted client-side using FHE (Fully Homomorphic Encryption) before any network call. The matching engine computes compatibility on encrypted inputs — no plaintext ever leaves your browser.

Built for the **Fhenix Privacy-by-Design Buildathon**, Wave 1.

---

## The Problem

Traditional job markets expose everything:

| Data Point | Traditional Market | Cipher CV |
|---|---|---|
| Salary History | Fully visible | `[ENCRYPTED]` |
| Current Employer | Visible | `[ENCRYPTED]` |
| Rejection Reason | "Overqualified" leaks budget | Blind rejection |
| Negotiation Position | Desperation visible | Zero knowledge |
| Bias Indicators | Name, photo, age visible | Identity hidden |

---

## How It Works