from app.supabase import (
    supabase,
    get_current_user,
)


def get_timeline(patient_id: str | None) -> list:
    '''
        if patient_id: select where patient_id; else select all. Return list of events.
    '''
    try:
        print(get_current_user())
        res = (
            supabase
            .table("timeline_events")
            .select("*")
            .eq("client_id", client_id)
            .execute()
        )
        print(res)

    except Exception as e:
        print(f"Error while fetching timelines:  {e}")

