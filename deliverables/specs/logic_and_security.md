# Business Logic & Security

## 1. Attendance Formulas

### Variables
- `T` = Total planned classes for the semester (from `Subjects.total_classes_T`)
- `C` = Conducted classes so far (`count(Sessions where status='conducted')`)
- `A` = Attended classes (`count(Attendance where present=true)`)
- `required_pct` = Threshold (e.g., 0.75 or 75%)

### Logic
```python
# 1. Total classes required to meet threshold at end of semester
required_total = ceil(required_pct * T)

# 2. Remaining classes
rem = T - C

# 3. How many MORE classes needed (from remaining)
needed_from_remaining = max(0, required_total - A)

# 4. Max "bunks" allowed (how many can I miss and still pass?)
# Logic: If I attend everything from now on, will I be safe?
# If (A + rem) < required_total, then it's IMPOSSIBLE.
# Else:
possible_final_attendance = A + rem
buffer = possible_final_attendance - required_total
max_misses = clamp(buffer, 0, rem)

# 5. Current Percentage
current_pct = (C == 0) ? 100.0 : round((A / C) * 100, 2)
```

### Status Logic (UI Colors)
- **Green**: `current_pct` > `required_pct` + 5% AND `max_misses` > 2
- **Yellow (Warning)**: `current_pct` is bordering threshold OR `max_misses` <= 2
- **Red (Danger)**: `current_pct` < `required_pct` OR `needed_from_remaining` > `rem` (Impossible)

---

## 2. "What-if" Simulator Logic
Input: `simulate_attend`, `simulate_miss`

```python
new_C = C + simulate_attend + simulate_miss
new_A = A + simulate_attend
new_pct = (new_C == 0) ? 0 : (new_A / new_C) * 100

# Re-run risk analysis with new_A and new_C
```

---

## 3. Security & Privacy

### Authentication
- **SSO**: Prefer SAML/OAuth2 with college email domain restriction (`@nmims.edu`).
- **JWT**: Stateless session management. Token contains hashed role.
- **2FA**: Required for Admin accounts.

### Data Privacy (GDPR / Indian DPDP)
- **Minimal PII**: Only store Name, Email, Enrollment No. Avoid detailed biometrics unless hashed locally.
- **Retention**: Analytics data anonymized after 1 year. Correction proofs deleted 30 days after resolution.

### RBAC (Role-Based Access Control)
- **Student**: Read-only own data. Write `CorrectionRequest`.
- **Faculty**: Read-only assigned subjects. Write `Attendance`, `Sessions`.
- **Admin**: Full Read/Write access.

---

## 4. Deployment Hints

### Stack
- **Frontend**: React 18, Tailwind CSS, Framer Motion (animations), Vite.
- **Backend**: Node.js (Express) or Python (FastAPI).
- **Database**: PostgreSQL (Supabase/Neon for serverless).

### Infrastructure
- **Docker**:
  ```yaml
  version: '3.8'
  services:
    web:
      build: ./frontend
      ports: ["3000:80"]
    api:
      build: ./backend
      ports: ["8000:8000"]
      env_file: .env
    db:
      image: postgres:15
      volumes: [pgdata:/var/lib/postgresql/data]
  ```
- **CI/CD**: GitHub action to lint & build on push. Main branch auto-deploys to Vercel (Front) + Render (Back).
