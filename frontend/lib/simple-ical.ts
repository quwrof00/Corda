
export interface IcalEvent {
    uid?: string;
    summary?: string;
    description?: string;
    categories?: string;
    start?: Date;
    end?: Date;
    type: "VEVENT";
}

export function parseICS(icsData: string, timezoneOffset?: number): Record<string, IcalEvent> {
    const events: Record<string, IcalEvent> = {};

    // Normalize line endings
    const cleanData = icsData.replace(/\r\n/g, "\n");

    // Split into VEVENT chunks
    const chunks = cleanData.split("BEGIN:VEVENT");

    // Skip the first chunk (header)
    for (let i = 1; i < chunks.length; i++) {
        const chunk = chunks[i];
        const uidMatch = chunk.match(/UID:(.*?)(\n|$)/);
        const summaryMatch = chunk.match(/SUMMARY:(.*?)(\n|$)/);
        const descMatch = chunk.match(/DESCRIPTION:(.*?)(\n|$)/);
        const categoriesMatch = chunk.match(/CATEGORIES:(.*?)(\n|$)/);
        const dtStartMatch = chunk.match(/DTSTART(?:;.*?)?:(.*?)(?:\n|$)/);
        const dtEndMatch = chunk.match(/DTEND(?:;.*?)?:(.*?)(?:\n|$)/);

        if (uidMatch) {
            const uid = uidMatch[1].trim();
            events[uid] = {
                type: "VEVENT",
                uid: uid,
                summary: summaryMatch ? unescapeIcal(summaryMatch[1].trim()) : "No Title",
                description: descMatch ? unescapeIcal(descMatch[1].trim()) : "",
                categories: categoriesMatch ? unescapeIcal(categoriesMatch[1].trim()) : undefined,
                start: dtStartMatch ? parseIcalDate(dtStartMatch[1].trim(), timezoneOffset) : undefined,
                end: dtEndMatch ? parseIcalDate(dtEndMatch[1].trim(), timezoneOffset) : undefined,
            };

            // Fallback if no end date, use start date
            if (!events[uid].end && events[uid].start) {
                events[uid].end = events[uid].start;
            }
        }
    }

    return events;
}

function unescapeIcal(str: string): string {
    return str.replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\n/g, "\n").replace(/\\\\/g, "\\");
}

function parseIcalDate(dateStr: string, timezoneOffset?: number): Date | undefined {
    try {
        // Handle YYYYMMDDTHHMMSSZ or YYYYMMDD
        if (dateStr.length >= 8) {
            const year = parseInt(dateStr.substring(0, 4));
            const month = parseInt(dateStr.substring(4, 6)) - 1;
            const day = parseInt(dateStr.substring(6, 8));

            let hour = 0, minute = 0, second = 0;

            if (dateStr.includes("T")) {
                const timePart = dateStr.split("T")[1];
                if (timePart.length >= 4) {
                    hour = parseInt(timePart.substring(0, 2));
                    minute = parseInt(timePart.substring(2, 4));
                    if (timePart.length >= 6) {
                        second = parseInt(timePart.substring(4, 6));
                    }
                }
            }

            // Moodle exports can be floating local times or UTC times that ignore user local settings.
            // By applying the user's timezone offset, we map it to exactly the wall-clock time they expect.
            const utcDate = new Date(Date.UTC(year, month, day, hour, minute, second));
            if (timezoneOffset !== undefined) {
                utcDate.setMinutes(utcDate.getMinutes() + timezoneOffset);
            }
            return utcDate;
        }
    } catch {
        return undefined;
    }
    return undefined;
}
