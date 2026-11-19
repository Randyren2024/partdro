-- Explicitly document the only intended row-level access path for private inquiry tables.
create policy "Service role manages inquiries"
on public.inquiries
for all
to service_role
using (true)
with check (true);

create policy "Service role manages inquiry rate limits"
on public.inquiry_rate_limits
for all
to service_role
using (true)
with check (true);
