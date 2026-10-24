-- =====================================================================
--  EVENTO — pagamento sul posto con POS
--
--  "pagato_in_loco" resta il valore storico e da ora significa "pagato in
--  contanti" (etichetta lato admin); "pagato_pos" distingue l'incasso con
--  POS, cosi' i riepiloghi separano contanti ed elettronico (POS + bonifico).
-- =====================================================================

alter type public.payment_status add value if not exists 'pagato_pos';
