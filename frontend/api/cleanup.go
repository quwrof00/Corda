package handler

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/jackc/pgx/v5"
)

// Handler is the entry point for Vercel Serverless Function
func Handler(w http.ResponseWriter, r *http.Request) {
	// Verify Vercel Cron trigger (optional but recommended for security)
	// if r.Header.Get("Authorization") != fmt.Sprintf("Bearer %s", os.Getenv("CRON_SECRET")) {
	// 	http.Error(w, "Unauthorized", http.StatusUnauthorized)
	// 	return
	// }

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		http.Error(w, "DATABASE_URL is not set", http.StatusInternalServerError)
		return
	}

	ctx := context.Background()
	conn, err := pgx.Connect(ctx, dbURL)
	if err != nil {
		http.Error(w, fmt.Sprintf("Unable to connect to database: %v", err), http.StatusInternalServerError)
		return
	}
	defer conn.Close(ctx)

	thirtyDaysAgo := time.Now().AddDate(0, 0, -30)

	// We want to delete stale tasks (status = 'completed', updatedAt < 30 days)
	// ONLY if they belong to a 'Personal' team AND the user has autoDeleteStaleTasks = true
	// We can do this in a single query using subqueries or joins.
	// Since Prisma quotes tables like "Task", "User", "Team"
	
	query := `
		DELETE FROM "Task"
		WHERE status = 'completed'
		  AND "updatedAt" < $1
		  AND "teamId" IN (
			SELECT t.id 
			FROM "Team" t
			JOIN "User" u ON t."leaderId" = u.id
			WHERE t.name = 'Personal' AND u."autoDeleteStaleTasks" = true
		  )
	`

	result, err := conn.Exec(ctx, query, thirtyDaysAgo)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to execute delete query: %v", err), http.StatusInternalServerError)
		return
	}

	rowsAffected := result.RowsAffected()
	fmt.Printf("Cleanup complete! Deleted %d personal stale task(s).\n", rowsAffected)
	
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, "Successfully deleted %d personal stale task(s).", rowsAffected)
}
