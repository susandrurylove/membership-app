# Daily Teaching Source and Email Notes

## Supplied publications

| Source | Physical pages | Extraction status | Daily Teaching relevance |
|---|---:|---|---|
| *The Elevated Body Card Game V19* | 130 | Image-only PDF; locally OCR-extracted with page boundaries | 21 body systems presented through Purpose, Inquiry, and Transcendence, plus welcome and closing material |
| *Paul Wagner Susan Drury Booklet* | 82 | Image-only PDF; locally OCR-extracted with page boundaries | Card practices, 21 detailed body-system explorations, daily practices, safety guidance, and closing blessing |
| *Elevating Origins to Love* | 279 | Embedded text extracted successfully | Long-form source for origins, belief, nervous-system, relationship, transformation, and guided-practice teachings |

The card deck contains 63 principal cards for 21 body systems. Each system is presented through the three perspectives **Purpose**, **Inquiry**, and **Transcendence**. The booklet confirms this structure and adds short practices that naturally fit the Daily Teaching format, including the five-minute start, daily body dialogue, morning pull/evening reflection, breathwork, journaling, movement, and the 21-day body journey.

All body-oriented Daily Teachings must retain the source’s explicit educational and reflective framing. They must not imply diagnosis, guarantee healing, or replace medical or mental-health care. The booklet’s crisis and professional-support language must remain available wherever sensitive material is surfaced.

## SMTP2GO delivery contract

The current repository contains no existing mail transport or reminder worker. Susan supplied the Railway environment contract separately: authenticated SMTP host, port, username, password, sender email, sender name, and timeout. Secrets must remain in Railway environment variables and never enter Git.

SMTP2GO requires authenticated sending and a verified sender. Its official API documentation also confirms that successful API sends return HTTP 200 and that unverified senders are rejected.[1] [2] Although this implementation will use Susan’s supplied authenticated SMTP account rather than the HTTP API, the verified-sender requirement still applies.

## References

[1]: https://developers.smtp2go.com/docs/send-an-email "SMTP2GO — Send an Email"
[2]: https://developers.smtp2go.com/docs/getting-started "SMTP2GO — Getting Started with the API"
[3]: https://developers.smtp2go.com/reference/authentication "SMTP2GO — Authentication"
