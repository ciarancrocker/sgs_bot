# Migrations
This is a stop-gap until proper migrations are implemented at a later date

## 2017-08-31T21:56:57.010Z
```
alter table channels add column temporary_index int;
```

## 2017-09-10T15:04:03.305Z
```
create table static_commands (command varchar not null, return_text varchar not null, primary key (command));
```

## 2017-10-05T17:04:54.934Z
```
CREATE TABLE event_log ("timestamp" timestamp with time zone DEFAULT now() NOT NULL, event_type character varying NOT NULL, data json);
CREATE INDEX event_log_timestamp_idx ON event_log USING btree ("timestamp");
```

## 2017-03-07
```
ALTER TABLE games RENAME name TO display_name;
ALTER TABLE games ADD COLUMN IF NOT EXISTS internal_name VARCHAR;
ALTER TABLE games ADD COLUMN IF NOT EXISTS hash BYTEA;
```

## 2018-05-20
```
ALTER TABLE users ADD COLUMN IF NOT EXISTS gdpr_consented BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gdpr_consent_requested BOOLEAN DEFAULT FALSE;
```

## 2018-10-31
```
CREATE TABLE purge_log ("message_id" VARCHAR NOT NULL, "author_id" VARCHAR NOT NULL, "content" VARCHAR NOT NULL, "purged_by" VARCHAR NOT NULL, "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL);
```