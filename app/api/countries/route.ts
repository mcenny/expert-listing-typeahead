import { NextRequest, NextResponse } from "next/server";
import { searchCountries } from "@/lib/countries";

const MIN_QUERY_LENGTH = 2;
const MAX_QUERY_LENGTH = 80;

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (query.length < MIN_QUERY_LENGTH) {
    return NextResponse.json(
      { data: [], error: "Query must contain at least 2 characters." },
      { status: 400 },
    );
  }

  if (query.length > MAX_QUERY_LENGTH) {
    return NextResponse.json(
      { data: [], error: "Query is too long." },
      { status: 400 },
    );
  }

  try {
    const countries = await searchCountries(query, request.signal);

    return NextResponse.json(
      { data: countries },
      {
        headers: {
          "Cache-Control": "private, max-age=0, must-revalidate",
        },
      },
    );
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return NextResponse.json(
        { data: [], error: "Request cancelled." },
        { status: 499 },
      );
    }

    const message =
      error instanceof Error
        ? error.message
        : "Unable to search countries.";

    return NextResponse.json(
      { data: [], error: message },
      { status: 502 },
    );
  }
}
