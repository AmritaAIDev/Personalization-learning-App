# Dashboard components

`StudentActionCenter` renders the student’s next action, short daily route, revision queue, and recent activity from the authenticated `/api/dashboard/student` response.

It does not hold learner state or create mock data. The subject map uses catalogue-backed coverage records; its local selection state only changes the currently visible subject. Navigation targets are derived from server-provided action metadata and use the existing learning URL builder to preserve subject, chapter, and topic context.
