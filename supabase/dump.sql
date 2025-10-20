


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."get_investment_history"("user_profile_id" "uuid", "limit_count" integer DEFAULT 50) RETURNS TABLE("id" "uuid", "movement_type" character varying, "amount" numeric, "token" character varying, "vault_address" "text", "investment_name" "text", "created_at" timestamp with time zone, "tx_hash" character varying)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    im.id,
    im.movement_type,
    im.amount,
    im.token,
    COALESCE(im.metadata->>'vault_address', 'main') as vault_address,
    i.investment_name,
    im.created_at,
    im.tx_hash
  FROM investment_movements im
  LEFT JOIN investments i ON im.investment_id = i.id
  WHERE im.profile_id = user_profile_id
  ORDER BY im.created_at DESC
  LIMIT limit_count;
END;
$$;


ALTER FUNCTION "public"."get_investment_history"("user_profile_id" "uuid", "limit_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_investment_summary_by_vault"("user_profile_id" "uuid", "target_vault_address" "text" DEFAULT NULL::"text") RETURNS TABLE("vault_address" "text", "total_invested" numeric, "total_rewards" numeric, "total_value" numeric, "investment_count" bigint)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(im.metadata->>'vault_address', 'main') as vault_address,
    COALESCE(SUM(CASE WHEN im.movement_type = 'deposit' THEN im.amount ELSE 0 END), 0) as total_invested,
    COALESCE(SUM(CASE WHEN im.movement_type = 'reward' THEN im.amount ELSE 0 END), 0) as total_rewards,
    COALESCE(SUM(CASE WHEN im.movement_type IN ('deposit', 'reward') THEN im.amount ELSE 0 END), 0) as total_value,
    COUNT(DISTINCT im.investment_id) as investment_count
  FROM investment_movements im
  WHERE im.profile_id = user_profile_id
    AND im.status = 'confirmed'
    AND (target_vault_address IS NULL OR im.metadata->>'vault_address' = target_vault_address)
  GROUP BY COALESCE(im.metadata->>'vault_address', 'main')
  ORDER BY total_value DESC;
END;
$$;


ALTER FUNCTION "public"."get_investment_summary_by_vault"("user_profile_id" "uuid", "target_vault_address" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_total_balance"("user_id" "uuid", "usdc_price" numeric DEFAULT 1.0) RETURNS numeric
    LANGUAGE "sql" STABLE
    AS $$
  SELECT balance + (
    COALESCE(
      (SELECT SUM(amount) 
       FROM transactions 
       WHERE sender_profile_id = user_id 
       AND status = 'success'
       AND token = 'USDC'), 
      0
    ) * usdc_price
  )
  FROM profiles
  WHERE id = user_id;
$$;


ALTER FUNCTION "public"."get_total_balance"("user_id" "uuid", "usdc_price" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_total_invested_amount"("user_profile_id" "uuid") RETURNS numeric
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  total_amount NUMERIC;
BEGIN
  SELECT COALESCE(SUM(amount), 0)
  INTO total_amount
  FROM investment_movements
  WHERE profile_id = user_profile_id
    AND movement_type = 'deposit'
    AND status = 'confirmed';
  
  RETURN total_amount;
END;
$$;


ALTER FUNCTION "public"."get_total_invested_amount"("user_profile_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_total_rewards_earned"("user_profile_id" "uuid") RETURNS numeric
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  total_rewards NUMERIC;
BEGIN
  SELECT COALESCE(SUM(amount), 0)
  INTO total_rewards
  FROM investment_movements
  WHERE profile_id = user_profile_id
    AND movement_type = 'reward'
    AND status = 'confirmed';
  
  RETURN total_rewards;
END;
$$;


ALTER FUNCTION "public"."get_total_rewards_earned"("user_profile_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_transaction_count"("user_id" "uuid") RETURNS TABLE("total_sent" bigint, "total_received" bigint, "pending_count" bigint)
    LANGUAGE "sql" STABLE
    AS $$
  SELECT 
    COUNT(*) FILTER (WHERE sender_profile_id = user_id) as total_sent,
    COUNT(*) FILTER (WHERE recipient_id IN (
      SELECT id FROM recipients WHERE profile_id = user_id
    )) as total_received,
    COUNT(*) FILTER (WHERE sender_profile_id = user_id AND status IN ('pending', 'sent')) as pending_count
  FROM transactions;
$$;


ALTER FUNCTION "public"."get_transaction_count"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_investment_movements_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_investment_movements_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_investments_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_investments_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."ai_operations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "operation_type" "text" NOT NULL,
    "operation_data" "jsonb" NOT NULL,
    "user_message" "text" NOT NULL,
    "ai_response" "text" NOT NULL,
    "user_confirmed" boolean DEFAULT false,
    "executed" boolean DEFAULT false,
    "execution_result" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "executed_at" timestamp with time zone,
    CONSTRAINT "ai_operations_operation_type_check" CHECK (("operation_type" = ANY (ARRAY['payment'::"text", 'analysis'::"text", 'query'::"text"])))
);


ALTER TABLE "public"."ai_operations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."investment_movements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "investment_id" "uuid" NOT NULL,
    "movement_type" character varying(20) NOT NULL,
    "amount" numeric(20,8) NOT NULL,
    "token" character varying(10) DEFAULT 'USDC'::character varying NOT NULL,
    "tx_hash" character varying(66),
    "chain" character varying(20) DEFAULT 'base'::character varying,
    "status" character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "investment_movements_movement_type_check" CHECK ((("movement_type")::"text" = ANY ((ARRAY['deposit'::character varying, 'withdrawal'::character varying, 'reward'::character varying, 'fee'::character varying])::"text"[]))),
    CONSTRAINT "investment_movements_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'confirmed'::character varying, 'failed'::character varying])::"text"[])))
);


ALTER TABLE "public"."investment_movements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."investments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "investment_name" character varying(255) NOT NULL,
    "investment_type" character varying(50) NOT NULL,
    "vault_address" character varying(42),
    "amount_invested" numeric(20,8) DEFAULT 0 NOT NULL,
    "current_rewards" numeric(20,8) DEFAULT 0 NOT NULL,
    "apr" numeric(5,2) NOT NULL,
    "status" character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "investments_investment_type_check" CHECK ((("investment_type")::"text" = ANY ((ARRAY['morpho_vault'::character varying, 'savings_account'::character varying])::"text"[]))),
    CONSTRAINT "investments_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'active'::character varying, 'completed'::character varying, 'failed'::character varying])::"text"[])))
);


ALTER TABLE "public"."investments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "handle" "text" NOT NULL,
    "wallet_address" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "text" DEFAULT 'active'::"text",
    CONSTRAINT "profiles_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."profiles" IS 'User profiles - the center of the data model';



COMMENT ON COLUMN "public"."profiles"."wallet_address" IS 'Blockchain wallet address (Base chain)';



CREATE TABLE IF NOT EXISTS "public"."recipients" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "profile_id_link" "uuid",
    "external_address" "text",
    "bank_details" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "recipient_type" character varying(20) DEFAULT 'crypto'::character varying,
    CONSTRAINT "chk_recipient_type" CHECK ((("recipient_type")::"text" = ANY ((ARRAY['crypto'::character varying, 'bank'::character varying])::"text"[]))),
    CONSTRAINT "recipients_recipient_type_check" CHECK ((("recipient_type")::"text" = ANY ((ARRAY['crypto'::character varying, 'bank'::character varying])::"text"[]))),
    CONSTRAINT "recipients_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text"])))
);


ALTER TABLE "public"."recipients" OWNER TO "postgres";


COMMENT ON TABLE "public"."recipients" IS 'Recipients/friends list - linked to profile who added them';



COMMENT ON COLUMN "public"."recipients"."profile_id" IS 'The profile who owns this recipient (whose friends list this is in)';



COMMENT ON COLUMN "public"."recipients"."profile_id_link" IS 'If recipient is an app user, link to their profile';



COMMENT ON COLUMN "public"."recipients"."external_address" IS 'If recipient is external wallet, store address here';



CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "sender_profile_id" "uuid" NOT NULL,
    "recipient_id" "uuid" NOT NULL,
    "tx_hash" "text",
    "chain" "text" DEFAULT 'base'::"text" NOT NULL,
    "amount" numeric(20,8) NOT NULL,
    "token" "text" DEFAULT 'USDC'::"text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "chk_success_requires_hash" CHECK ((("status" <> 'success'::"text") OR ("tx_hash" IS NOT NULL))),
    CONSTRAINT "transactions_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'sent'::"text", 'success'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."transactions" OWNER TO "postgres";


COMMENT ON TABLE "public"."transactions" IS 'Transaction history - linked to sender profile';



COMMENT ON COLUMN "public"."transactions"."sender_profile_id" IS 'Profile who sent this transaction';



COMMENT ON COLUMN "public"."transactions"."recipient_id" IS 'Recipient from recipients table';



COMMENT ON COLUMN "public"."transactions"."amount" IS 'Amount in token units (8 decimal places for crypto)';



ALTER TABLE ONLY "public"."ai_operations"
    ADD CONSTRAINT "ai_operations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."investment_movements"
    ADD CONSTRAINT "investment_movements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."investments"
    ADD CONSTRAINT "investments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."recipients"
    ADD CONSTRAINT "recipients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_ai_operations_created" ON "public"."ai_operations" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_ai_operations_executed" ON "public"."ai_operations" USING "btree" ("profile_id", "executed");



CREATE INDEX "idx_ai_operations_profile" ON "public"."ai_operations" USING "btree" ("profile_id");



CREATE INDEX "idx_ai_operations_type" ON "public"."ai_operations" USING "btree" ("operation_type");



CREATE INDEX "idx_investment_movements_created_at" ON "public"."investment_movements" USING "btree" ("created_at");



CREATE INDEX "idx_investment_movements_investment_id" ON "public"."investment_movements" USING "btree" ("investment_id");



CREATE INDEX "idx_investment_movements_profile_id" ON "public"."investment_movements" USING "btree" ("profile_id");



CREATE INDEX "idx_investment_movements_status" ON "public"."investment_movements" USING "btree" ("status");



CREATE INDEX "idx_investment_movements_type" ON "public"."investment_movements" USING "btree" ("movement_type");



CREATE INDEX "idx_investments_created_at" ON "public"."investments" USING "btree" ("created_at");



CREATE INDEX "idx_investments_profile_id" ON "public"."investments" USING "btree" ("profile_id");



CREATE INDEX "idx_investments_status" ON "public"."investments" USING "btree" ("status");



CREATE INDEX "idx_profiles_handle" ON "public"."profiles" USING "btree" ("handle");



CREATE INDEX "idx_profiles_status" ON "public"."profiles" USING "btree" ("status");



CREATE INDEX "idx_profiles_wallet" ON "public"."profiles" USING "btree" ("wallet_address");



CREATE INDEX "idx_recipients_name" ON "public"."recipients" USING "btree" ("profile_id", "name");



CREATE INDEX "idx_recipients_profile" ON "public"."recipients" USING "btree" ("profile_id");



CREATE INDEX "idx_recipients_profile_link" ON "public"."recipients" USING "btree" ("profile_id_link");



CREATE INDEX "idx_transactions_created_at" ON "public"."transactions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_transactions_recipient" ON "public"."transactions" USING "btree" ("recipient_id");



CREATE INDEX "idx_transactions_recipient_created" ON "public"."transactions" USING "btree" ("recipient_id", "created_at" DESC);



CREATE INDEX "idx_transactions_sender" ON "public"."transactions" USING "btree" ("sender_profile_id");



CREATE INDEX "idx_transactions_sender_created" ON "public"."transactions" USING "btree" ("sender_profile_id", "created_at" DESC);



CREATE INDEX "idx_transactions_sender_status" ON "public"."transactions" USING "btree" ("sender_profile_id", "status");



CREATE INDEX "idx_transactions_status" ON "public"."transactions" USING "btree" ("status") WHERE ("status" = ANY (ARRAY['pending'::"text", 'sent'::"text"]));



CREATE UNIQUE INDEX "profiles_handle_active_unique" ON "public"."profiles" USING "btree" ("handle") WHERE (("status" IS NULL) OR ("status" = 'active'::"text"));



CREATE UNIQUE INDEX "profiles_wallet_address_active_unique" ON "public"."profiles" USING "btree" ("wallet_address") WHERE (("status" IS NULL) OR ("status" = 'active'::"text"));



CREATE UNIQUE INDEX "unique_profile_address" ON "public"."recipients" USING "btree" ("profile_id", "external_address") WHERE ("external_address" IS NOT NULL);



CREATE UNIQUE INDEX "unique_profile_link" ON "public"."recipients" USING "btree" ("profile_id", "profile_id_link") WHERE ("profile_id_link" IS NOT NULL);



CREATE OR REPLACE TRIGGER "update_investment_movements_updated_at" BEFORE UPDATE ON "public"."investment_movements" FOR EACH ROW EXECUTE FUNCTION "public"."update_investment_movements_updated_at"();



CREATE OR REPLACE TRIGGER "update_investments_updated_at" BEFORE UPDATE ON "public"."investments" FOR EACH ROW EXECUTE FUNCTION "public"."update_investments_updated_at"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_transactions_updated_at" BEFORE UPDATE ON "public"."transactions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."ai_operations"
    ADD CONSTRAINT "ai_operations_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."investment_movements"
    ADD CONSTRAINT "investment_movements_investment_id_fkey" FOREIGN KEY ("investment_id") REFERENCES "public"."investments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."investment_movements"
    ADD CONSTRAINT "investment_movements_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."investments"
    ADD CONSTRAINT "investments_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."recipients"
    ADD CONSTRAINT "recipients_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."recipients"
    ADD CONSTRAINT "recipients_profile_id_link_fkey" FOREIGN KEY ("profile_id_link") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "public"."recipients"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_sender_profile_id_fkey" FOREIGN KEY ("sender_profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "Allow profile creation" ON "public"."profiles" FOR INSERT WITH CHECK (true);



COMMENT ON POLICY "Allow profile creation" ON "public"."profiles" IS 'Allow creating profiles during signup before auth is established';



CREATE POLICY "Allow profile updates" ON "public"."profiles" FOR UPDATE USING (true) WITH CHECK (true);



CREATE POLICY "Anyone can view profiles" ON "public"."profiles" FOR SELECT USING (true);



COMMENT ON POLICY "Anyone can view profiles" ON "public"."profiles" IS 'Allow reading profiles for signup validation and friends list';



CREATE POLICY "Users can create own recipients" ON "public"."recipients" FOR INSERT WITH CHECK (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users can create own transactions" ON "public"."transactions" FOR INSERT WITH CHECK (("sender_profile_id" = "auth"."uid"()));



CREATE POLICY "Users can delete own recipients" ON "public"."recipients" FOR DELETE USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users can delete their own recipients" ON "public"."recipients" FOR DELETE USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can insert their own investment movements" ON "public"."investment_movements" FOR INSERT WITH CHECK ((("auth"."uid"())::"text" = ("profile_id")::"text"));



CREATE POLICY "Users can insert their own investments" ON "public"."investments" FOR INSERT WITH CHECK ((("auth"."uid"())::"text" = ("profile_id")::"text"));



CREATE POLICY "Users can insert their own recipients" ON "public"."recipients" FOR INSERT WITH CHECK (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can select their own recipients" ON "public"."recipients" FOR SELECT USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can update own recipients" ON "public"."recipients" FOR UPDATE USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users can update own transactions" ON "public"."transactions" FOR UPDATE USING (("sender_profile_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own investment movements" ON "public"."investment_movements" FOR UPDATE USING ((("auth"."uid"())::"text" = ("profile_id")::"text"));



CREATE POLICY "Users can update their own investments" ON "public"."investments" FOR UPDATE USING ((("auth"."uid"())::"text" = ("profile_id")::"text"));



CREATE POLICY "Users can update their own recipients" ON "public"."recipients" FOR UPDATE USING (("auth"."uid"() = "profile_id")) WITH CHECK (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can view own recipients" ON "public"."recipients" FOR SELECT USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users can view own transactions" ON "public"."transactions" FOR SELECT USING ((("sender_profile_id" = "auth"."uid"()) OR ("recipient_id" IN ( SELECT "recipients"."id"
   FROM "public"."recipients"
  WHERE ("recipients"."profile_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own investment movements" ON "public"."investment_movements" FOR SELECT USING ((("auth"."uid"())::"text" = ("profile_id")::"text"));



CREATE POLICY "Users can view their own investments" ON "public"."investments" FOR SELECT USING ((("auth"."uid"())::"text" = ("profile_id")::"text"));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."get_investment_history"("user_profile_id" "uuid", "limit_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_investment_history"("user_profile_id" "uuid", "limit_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_investment_history"("user_profile_id" "uuid", "limit_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_investment_summary_by_vault"("user_profile_id" "uuid", "target_vault_address" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_investment_summary_by_vault"("user_profile_id" "uuid", "target_vault_address" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_investment_summary_by_vault"("user_profile_id" "uuid", "target_vault_address" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_total_balance"("user_id" "uuid", "usdc_price" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."get_total_balance"("user_id" "uuid", "usdc_price" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_total_balance"("user_id" "uuid", "usdc_price" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_total_invested_amount"("user_profile_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_total_invested_amount"("user_profile_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_total_invested_amount"("user_profile_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_total_rewards_earned"("user_profile_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_total_rewards_earned"("user_profile_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_total_rewards_earned"("user_profile_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_transaction_count"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_transaction_count"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_transaction_count"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_investment_movements_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_investment_movements_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_investment_movements_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_investments_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_investments_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_investments_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."ai_operations" TO "anon";
GRANT ALL ON TABLE "public"."ai_operations" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_operations" TO "service_role";



GRANT ALL ON TABLE "public"."investment_movements" TO "anon";
GRANT ALL ON TABLE "public"."investment_movements" TO "authenticated";
GRANT ALL ON TABLE "public"."investment_movements" TO "service_role";



GRANT ALL ON TABLE "public"."investments" TO "anon";
GRANT ALL ON TABLE "public"."investments" TO "authenticated";
GRANT ALL ON TABLE "public"."investments" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."recipients" TO "anon";
GRANT ALL ON TABLE "public"."recipients" TO "authenticated";
GRANT ALL ON TABLE "public"."recipients" TO "service_role";



GRANT ALL ON TABLE "public"."transactions" TO "anon";
GRANT ALL ON TABLE "public"."transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































RESET ALL;
