
import json
import random
from datetime import datetime, timedelta

# Doctor Data (from previous query)
doctors_json = """
[
    {"id":"14f0c22b-615f-4cf5-b388-c136839af576","full_name":"Dr. Attending 1","medical_role":"attending"},
    {"id":"bb59e739-8207-4c67-a6ff-1a809c734c35","full_name":"Dr. Attending 2","medical_role":"attending"},
    {"id":"178289a2-8106-4f3f-a8b1-0ccfc3dc3522","full_name":"Dr. Attending 3","medical_role":"attending"},
    {"id":"1256f8c4-26ec-4296-8a8d-d5d42dbf9ebc","full_name":"Dr. Attending 4","medical_role":"attending"},
    {"id":"d563518e-48d3-4d50-b46f-46d9adb3ed2b","full_name":"Dr. Attending 5","medical_role":"attending"},
    {"id":"5e2866f2-c4d2-4331-a029-52af598dbd28","full_name":"Dr. Attending 6","medical_role":"attending"},
    {"id":"eba415b8-d6a8-4bcf-873f-a3e29229fe13","full_name":"Dr. Attending 7","medical_role":"attending"},
    {"id":"c1ad00ee-86fa-4b17-9db6-3af68ab6d526","full_name":"Dr. Attending 8","medical_role":"attending"},
    {"id":"719ee5f5-1efe-4a39-bab5-8bfaf0dca859","full_name":"Dr. Attending 9","medical_role":"attending"},
    {"id":"d0136366-f0bd-40a2-aac1-fbb337393f48","full_name":"Dr. Attending 10","medical_role":"attending"},
    {"id":"3dd4dc88-55df-4570-a0ce-19b866b4415f","full_name":"Dr. Attending 11","medical_role":"attending"},
    {"id":"14764b98-72b0-4d71-8e2e-c65a86c6e807","full_name":"Dr. Attending 12","medical_role":"attending"},
    {"id":"31ad5559-1a44-437c-8d82-7043501910bb","full_name":"Dr. Attending 13","medical_role":"attending"},
    {"id":"8b0456ad-2bfb-47c9-b6f9-3684d836dd9e","full_name":"Dr. Attending 14","medical_role":"attending"},
    {"id":"f3cfd9f5-0a11-47ad-a37a-c615ad153d4d","full_name":"Dr. Attending 15","medical_role":"attending"},
    {"id":"ec069a05-c4d4-4960-ac81-3404bc5f028b","full_name":"Dr. Attending 16","medical_role":"attending"},
    {"id":"7a429473-4690-4f55-9e01-4066c9176d7f","full_name":"Dr. Attending 17","medical_role":"attending"},
    {"id":"3ca4cbd2-1509-4f37-8989-9ec2a50a9092","full_name":"Dr. Attending 18","medical_role":"attending"},
    {"id":"557983c1-f704-4c13-9c3d-065a7390c9db","full_name":"Dr. Attending 19","medical_role":"attending"},
    {"id":"99e3c5ef-cb3e-4eed-962b-30a7cff5ec12","full_name":"Dr. Attending 20","medical_role":"attending"},
    {"id":"dd22325b-c89c-401a-abf0-4e41a95e294f","full_name":"Dr. Noy M (Resident)","medical_role":"resident"},
    {"id":"1e5cc38a-ea42-4a8e-8bee-e464a084d884","full_name":"Dr. Resident 2","medical_role":"resident"},
    {"id":"0a7f4c13-b284-423d-9eeb-9ce24536b08e","full_name":"Dr. Resident 3","medical_role":"resident"},
    {"id":"269208d3-1296-4966-b661-15e476404223","full_name":"Dr. Resident 4","medical_role":"resident"},
    {"id":"9946a41f-5447-41d8-bd5c-1aea7be428fa","full_name":"Dr. Resident 5","medical_role":"resident"},
    {"id":"3e6a7f73-688b-4b0f-85ee-a2568398a36d","full_name":"Dr. Resident 6","medical_role":"resident"},
    {"id":"52ec159a-ebf8-49bc-ba83-14bd1160f31d","full_name":"Dr. Resident 7","medical_role":"resident"},
    {"id":"23ea32c8-51a8-47ee-9b9f-8e6d8d9a146a","full_name":"Dr. Resident 8","medical_role":"resident"},
    {"id":"37bb958d-1f2a-46f5-97f6-2890ef3e2854","full_name":"Dr. Resident 9","medical_role":"resident"},
    {"id":"d6cbbfbf-643a-415b-bb5b-195be68c6385","full_name":"Dr. Resident 10","medical_role":"resident"},
    {"id":"e8bee9e9-0af9-4844-9a95-be10b29ba20a","full_name":"Dr. Resident 11","medical_role":"resident"},
    {"id":"1485a530-b57f-4a6a-b6a4-32217ce62574","full_name":"Dr. Resident 12","medical_role":"resident"},
    {"id":"645c8426-8346-4d59-a68a-88263963ba69","full_name":"Dr. Resident 13","medical_role":"resident"},
    {"id":"7d593a59-94ec-4361-9be2-1bc251260ec9","full_name":"Dr. Resident 14","medical_role":"resident"},
    {"id":"a16911f7-cf08-4e28-a546-35a27507439b","full_name":"Dr. Resident 15","medical_role":"resident"},
    {"id":"c9719b75-8772-49aa-acf1-c939d255eca0","full_name":"Dr. Resident 16","medical_role":"resident"},
    {"id":"32e990ff-bab8-48b7-89c9-98b9fac06052","full_name":"Dr. Resident 17","medical_role":"resident"},
    {"id":"0b9fc256-f65e-4378-90c6-b74ae50c9770","full_name":"Dr. Resident 18","medical_role":"resident"},
    {"id":"3a3346d5-8024-4a37-bdaf-427e94761e09","full_name":"Dr. Resident 19","medical_role":"resident"},
    {"id":"fc7ae7b5-1706-45e8-ac23-7dc44c20f096","full_name":"Dr. Resident 20","medical_role":"resident"}
]
"""

doctors = json.loads(doctors_json)

# Segregate doctors
attendings = [d for d in doctors if d['medical_role'] == 'attending']
residents = [d for d in doctors if d['medical_role'] == 'resident']

# Split residents into Junior, Intermediate, Senior
# 20 residents -> ~6-7 per group
junior_residents = residents[:7]
intermediate_residents = residents[7:14]
senior_residents = residents[14:]

# Constraints
MAX_SHIFTS_PER_MONTH = 6

def generate_sql():
    # Helper to track shifts
    shift_counts = {d['id']: 0 for d in doctors}
    previous_day_shifts = set() # Set of doctor IDs who worked yesterday
    current_day_shifts = set() # Set of doctor IDs working today (to avoid double booking same day)
    
    start_date = datetime(2026, 1, 1)
    end_date = datetime(2026, 1, 31)
    
    sql_lines = []
    
    # 1. Create Schedule
    schedule_id = "550e8400-e29b-41d4-a716-446655440020" # Pre-generated UUID for the schedule
    sql_lines.append(f"INSERT INTO public.schedules (id, month, status) VALUES ('{schedule_id}', '2026-01-01', 'final') ON CONFLICT DO NOTHING;")
    sql_lines.append(f"DELETE FROM public.shifts WHERE schedule_id = '{schedule_id}';")
    
    # 2. Assign Shifts
    current_date = start_date
    while current_date <= end_date:
        date_str = current_date.strftime('%Y-%m-%d')
        current_day_shifts = set()
        
        roles_to_fill = [
            ("Junior Resident", junior_residents),
            ("Intermediate Resident", intermediate_residents),
            ("Senior Resident", senior_residents),
            ("Attending", attendings)
        ]
        
        for role_name, doctor_pool in roles_to_fill:
            # Filter pool:
            # 1. Not maxed out
            # 2. Not worked yesterday
            # 3. Not working today (redundant if pools are disjoint, but good for safety if we mix later)
            valid_candidates = [
                d for d in doctor_pool 
                if shift_counts[d['id']] < MAX_SHIFTS_PER_MONTH 
                and d['id'] not in previous_day_shifts
                and d['id'] not in current_day_shifts
            ]
            
            if not valid_candidates:
                # If we get stuck, simple randomize might fail us, but with this ratio it should be fine.
                # If valid_candidates is empty, we must pick someone, violating 'no consecutive' is lighter failure than 'max shifts' maybe?
                # But math says we should be fine. 
                # Let's try strictly enforced first.
                print(f"CRITICAL: No valid candidates for {role_name} on {date_str}")
                # Fallback: Relax 'previous day' constraint if absolutely necessary (but shouldn't be needed)
                valid_candidates = [
                    d for d in doctor_pool 
                    if shift_counts[d['id']] < MAX_SHIFTS_PER_MONTH 
                    and d['id'] not in current_day_shifts
                ]
            
            if not valid_candidates:
                 print(f"CRITICAL: IMPOSSIBLE to fill {role_name} on {date_str}")
                 continue

            selected_doc = random.choice(valid_candidates)
            
            # Commit choice
            shift_counts[selected_doc['id']] += 1
            current_day_shifts.add(selected_doc['id'])
            
            sql_lines.append(
                f"INSERT INTO public.shifts (schedule_id, date, shift_role, doctor_id) "
                f"VALUES ('{schedule_id}', '{date_str}', '{role_name}', '{selected_doc['id']}');"
            )

        previous_day_shifts = current_day_shifts.copy()
        current_date += timedelta(days=1)

    return "\n".join(sql_lines)

if __name__ == "__main__":
    sql_content = generate_sql()
    with open("seed_schedule.sql", "w", encoding="utf-8") as f:
        f.write(sql_content)
    print("SQL file generated successfully.")
