
# 1. Get Session Token (assuming existing user or using a specialized test endpoint if avail, but here we can try to hijack a session or just assume we have one if we use the browser or curl with headers).
# Since I cannot easily login via curl without a flow, I will just call the API and see if it 401s.
# If 401, I might need to generate a session locally in DB.

# 2. Query Calendar
curl -v http://localhost:3000/api/calendar

# 3. Query Gacha
curl -v -X POST http://localhost:3000/api/calendar/gacha
