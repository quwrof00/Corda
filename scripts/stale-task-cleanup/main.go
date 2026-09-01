package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/joho/godotenv"
)

func main() {
	fmt.Println("🧹 Starting Stale Task Cleanup...")

	// 1. Load environment variables from the Next.js frontend folder
	err := godotenv.Load("../../frontend/.env")
	if err != nil {
		log.Println("Warning: No .env file found in frontend folder or couldn't load it. We will rely on system environment variables.")
	}

	// 2. Get the database URL
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("❌ ERROR: DATABASE_URL is not set in your environment.")
	}

	// 3. Connect to the PostgreSQL database
	ctx := context.Background()
	conn, err := pgx.Connect(ctx, dbURL)
	if err != nil {
		log.Fatalf("❌ ERROR: Unable to connect to database: %v\n", err)
	}
	defer conn.Close(ctx)

	fmt.Println("✅ Successfully connected to the database!")

	// 4. Define our criteria for "stale" (completed more than 30 days ago)
	thirtyDaysAgo := time.Now().AddDate(0, 0, -30)

	fmt.Printf("🔍 Looking for 'completed' tasks updated before %s...\n", thirtyDaysAgo.Format("2006-01-02"))

	// 5. Execute the delete query
	// In Prisma, pascal-case models result in quoted table names like "Task"
	query := `
		DELETE FROM "Task"
		WHERE status = 'completed' AND "updatedAt" < $1
	`
	
	result, err := conn.Exec(ctx, query, thirtyDaysAgo)
	if err != nil {
		log.Fatalf("❌ ERROR: Failed to execute delete query: %v\n", err)
	}

	rowsAffected := result.RowsAffected()

	fmt.Printf("🎉 Cleanup complete! Deleted %d stale task(s).\n", rowsAffected)
}
