-- bcrypt hash of 'password123' (rounds=10)
UPDATE users 
SET password = '$2b$10$b.VGuvwhcN.02bSatezIaOBLxixLEXMUym2A63SGMAMrEsr1aEizO'
WHERE id = 116;

SELECT id, name, email, approved FROM users WHERE id = 116;
