## Algorithm Steps

1. **Step 1**: Group by cardinal direction

2. **Step 2**: Sort each group by time (add a critical flag if any exists)

3. **Step 3**: Rebatch by waypoints
    - Start and end at the store
    - If a critical waypoint exists:
        - Sort critical waypoints by time
        - Finish the critical batch first
        - Start from the last critical waypoint and batch by directions waypoint auto API
        - Concatenate the rebatched waypoints to this batch
    - Else:
        - Batch by directions waypoint auto API only :)
