//import { useIntl, FormattedRelativeTime, FormattedDate } from "react-intl"
//import type { IntlShape } from "react-intl";

// 01.11.2025 18:41 formatDateTime("2025-11-01T18:41:48.1470809")
// 01.11.2025       formatDate("2025-11-01T18:41:48.1470809")
// 18:41            formatTime("2025-11-01T18:41:48.1470809")
// 5 saat önce      timePassed("2025-11-01T18:41:48.1470809")

//const userLocale = (navigator.languages && navigator.languages[0]) || navigator.language || "en-US";
const userLocale = (navigator.languages && navigator.languages[navigator.languages.length - 1]) || navigator.language || "en-US";

function ensureDate(date: Date | string | number): Date
{
    return date instanceof Date ? date : new Date(date);
}

function dateDiff(date1: number, date2: number): { value: number; unit: Intl.RelativeTimeFormatUnit }
{
    let diff = date1 - date2;
    let diffAsSeconds = Math.ceil(diff / (1000));
    let diffAsMinutes = Math.ceil(diff / (1000 * 60));
    let diffAsHours = Math.ceil(diff / (1000 * 60 * 60));
    let diffAsDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
    //console.log(new Date(date1).toLocaleTimeString(), diff,"Days", diffAsDays,"Hours", diffAsHours,"Minutes", diffAsMinutes, "Seconds", diffAsSeconds);

    if (diffAsDays != 0)
        return {
            value: diffAsDays,
            unit: "day" as Intl.RelativeTimeFormatUnit
        };

    if (diffAsHours != 0)
        return {
            value: diffAsHours,
            unit: "hour" as Intl.RelativeTimeFormatUnit
        };

    if (diffAsMinutes != 0)
        return {
            value: diffAsMinutes,
            unit: "minute" as Intl.RelativeTimeFormatUnit
        };

    return {
        value: diffAsSeconds,
        unit: "second" as Intl.RelativeTimeFormatUnit
    };
}

export function formatDateTime(date: Date | string | number): string
{
    // 01.11.2025 18:41     { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }

    return new Intl
        .DateTimeFormat(userLocale, {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        })
        .format(ensureDate(date));
}

export function formatDate(date: Date | string | number): string
{
    /*
    1 Kasım 2025 Cumartesi  { year: "numeric", month: "long", day: "numeric", weekday: "long" }
    01 Kasım 2025           { year: "numeric", month: "long", day: "2-digit" }
    01 Kas 2025             { year: "numeric", month: "short", day: "2-digit" }
    01.11.2025              { year: "numeric", month: "2-digit", day: "2-digit" }
    */

    //const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "2-digit", day: "2-digit" };
    return new Intl
        .DateTimeFormat(userLocale, { year: "numeric", month: "2-digit", day: "2-digit" })
        .format(ensureDate(date));

    //const intl = useIntl();
    //return intl.formatDate(dateObj, { year: "numeric", month: "short", day: "2-digit" });
}

export function formatTime(date: Date | string | number): string
{
    /*
    return new Intl
        .DateTimeFormat(userLocale, { hour: "2-digit", minute: "2-digit" })
        .format(ensureDate(date));
    */
    return ensureDate(date)
        .toLocaleTimeString(userLocale, { hour: "2-digit", minute: "2-digit" });
}

export function isSameDay(date1: Date, date2: Date): boolean
{
    return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
    );
}

export function isToday(date: Date | string | number): boolean
{
    const today = new Date();
    return isSameDay(ensureDate(date), today);
}

export function isYesterday(date: Date | string | number): boolean
{
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return isSameDay(ensureDate(date), yesterday);
}

/*
export function useSmartDate(dateObj: Date)
{
    const intl = useIntl();

    if (isToday)
        return intl.formatTime(dateObj, { hour: "2-digit", minute: "2-digit" });
    else
        return intl.formatDate(dateObj, { year: "numeric", month: "short", day: "2-digit" });
}
*/

export function timePassed(/*intl: IntlShape,*/ date: Date | string | number)
{
    const theDate = ensureDate(date);
    let time: number = theDate.getTime();

    const { value, unit } = dateDiff(time, Date.now());

    //const result = intl.formatRelativeTime(value, unit, { numeric: "auto" });
    const result = new Intl
        .RelativeTimeFormat(userLocale, { numeric: "auto" })
        .format(value, unit);

    if (unit === "day")
    {
        if (value === -1) // yesterday
            return `${result} (${formatTime(theDate)})`;

        if (value <= -3 && value >= -7)
        {
            const dayName = new Intl.DateTimeFormat(userLocale, { weekday: "long" }).format(theDate);
            return dayName;
        }
    }

    return result;
}

/*
export const FormatDate = ({ date }: { date: Date }) =>
{
    const { value, unit } = dateDiff(date.getTime(), Date.now());

    return (
        <FormattedRelativeTime
            value={value}
            unit={unit}
            numeric="auto"
            //style="short"
        />
    );
}
*/