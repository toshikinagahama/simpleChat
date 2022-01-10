package PGNotifyBuilder

import (
	"fmt"
	"log"

	_ "github.com/lib/pq"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type Receive struct {
	DBConnect string
	EventName string
	Table     string
	SqlMethod string
	Payload   string
}

type PgTrigger struct {
	Tgname string
}

func dropTrigger(db *gorm.DB, tableName string) {
	var triggers []*PgTrigger

	db.Table("pg_trigger").Select("tgname").Scan(&triggers)
	for _, trigger := range triggers {
		sql := fmt.Sprintf(`DROP TRIGGER IF EXISTS %s ON %s CASCADE;`, trigger.Tgname, tableName)
		db.Exec(sql)
	}

}

func throwNotificationSQL(eventName string, table string, sqlMethod string, payload string) string {
	re := fmt.Sprintf(
		`
		begin;

		create or replace function %s_handler ()
			returns trigger
			language plpgsql
		as $$
		declare
			channel text := TG_ARGV[0];
			payload_json json;
		begin
			payload_json = json_build_object(%s);
			PERFORM pg_notify(channel, payload_json::text);
			RETURN NULL;
		end;
		$$;

		CREATE TRIGGER %s_trigger
		AFTER %s
		ON %s
		FOR EACH ROW
			EXECUTE PROCEDURE %s_handler('%s');

		commit;
		`, eventName, payload, eventName, sqlMethod, table, eventName, table)
	return re
}

func Serve(r *Receive) {
	db, err := gorm.Open(postgres.New(postgres.Config{
		DSN:                  "user=toshikinagahama password=toshi0819 dbname=chat_db port=5432 sslmode=disable TimeZone=Asia/Tokyo",
		PreferSimpleProtocol: true, // disables implicit prepared statement usage
	}), &gorm.Config{})
	db_v2, _ := db.DB()
	defer db_v2.Close()
	if err != nil {
		log.Fatal(err)
	}

	dropTrigger(db, r.Table)
	db.Exec(throwNotificationSQL(r.EventName, r.Table, r.SqlMethod, r.Payload))
}
