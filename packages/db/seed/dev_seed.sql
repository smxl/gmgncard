INSERT INTO users (handle, display_name, email, avatar_url, bio, password_hash, role)
VALUES
  ('alice', 'Alice Zhang', 'alice@example.com', 'https://example.com/alice.png', 'GMGN curator', 'd790cbc5a50c1ac8672c82b8862d225c6debe55d9c42e96edcd5b7ff8e197769', 'admin'),
  ('bob', 'Bob Li', 'bob@example.com', 'https://example.com/bob.png', 'Community mod', NULL, 'user')
ON CONFLICT(handle) DO UPDATE SET
  display_name = excluded.display_name,
  email = excluded.email,
  avatar_url = excluded.avatar_url,
  bio = excluded.bio,
  password_hash = excluded.password_hash,
  role = excluded.role,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO user_profiles (user_id, verification_status, p_size, f_size, age, wechat_qr_url, group_qr_url, notes, qr_access)
SELECT id, 'approved', '165', '45', 24, 'https://example.com/alice-wechat.png', NULL, 'Core team', 1
FROM users WHERE handle = 'alice'
ON CONFLICT(user_id) DO UPDATE SET
  verification_status = excluded.verification_status,
  p_size = excluded.p_size,
  f_size = excluded.f_size,
  age = excluded.age,
  wechat_qr_url = excluded.wechat_qr_url,
  group_qr_url = excluded.group_qr_url,
  notes = excluded.notes,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO link_types (slug, label, description)
VALUES
  ('default', '默认', 'Generic link'),
  ('wechat', '微信', 'WeChat profile')
ON CONFLICT(slug) DO NOTHING;

INSERT INTO links (user_id, type_id, title, url, `order`, is_hidden, metadata)
SELECT u.id, t.id, 'GMGN 官网', 'https://gmgncard.com', 1, 0, json_object('cta', 'Visit site')
FROM users u
LEFT JOIN link_types t ON t.slug = 'default'
WHERE u.handle = 'alice'
ON CONFLICT(id) DO NOTHING;

INSERT INTO links (user_id, type_id, title, url, `order`, is_hidden)
SELECT u.id, t.id, '客服微信', 'https://example.com/bob-wechat', 1, 0
FROM users u
LEFT JOIN link_types t ON t.slug = 'wechat'
WHERE u.handle = 'bob'
ON CONFLICT(id) DO NOTHING;
