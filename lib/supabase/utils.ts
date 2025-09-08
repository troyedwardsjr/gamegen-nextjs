import type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
} from "./database.types";

import { createClient } from "./client";
import { createClient as createServerClient } from "./server";
import { createAdminClient } from "./admin";

// Database utility functions
export class DatabaseError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any,
    public hint?: string,
  ) {
    super(message);
    this.name = "DatabaseError";
  }
}

// Generic CRUD operations
export class SupabaseService<T extends keyof Database["public"]["Tables"]> {
  constructor(
    private tableName: T,
    private isServer: boolean = false,
  ) {}

  protected getClient() {
    if (this.isServer) {
      return createServerClient();
    }

    return createClient();
  }

  async findById(id: string): Promise<Tables<T> | null> {
    const supabase = await this.getClient();
    const { data, error } = await (supabase as any)
      .from(this.tableName)
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // Not found
      }
      throw new DatabaseError(
        `Failed to find ${this.tableName} by id: ${id}`,
        error.code,
        error.details,
        error.hint,
      );
    }

    return data as any;
  }

  async findMany(
    options: {
      filters?: Record<string, any>;
      orderBy?: { column: string; ascending?: boolean };
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<Tables<T>[]> {
    const supabase = await this.getClient();
    let query = supabase.from(this.tableName).select("*");

    // Apply filters
    if (options.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    // Apply ordering
    if (options.orderBy) {
      query = query.order(options.orderBy.column, {
        ascending: options.orderBy.ascending ?? true,
      });
    }

    // Apply pagination
    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.offset) {
      query = query.range(
        options.offset,
        options.offset + (options.limit ?? 50) - 1,
      );
    }

    const { data, error } = await query;

    if (error) {
      throw new DatabaseError(
        `Failed to find ${this.tableName} records`,
        error.code,
        error.details,
        error.hint,
      );
    }

    return (data || []) as Tables<T>[];
  }

  async create(input: TablesInsert<T>): Promise<Tables<T>> {
    const supabase = await this.getClient();
    const { data, error } = await (supabase as any)
      .from(this.tableName)
      .insert(input)
      .select()
      .single();

    if (error) {
      throw new DatabaseError(
        `Failed to create ${this.tableName} record`,
        error.code,
        error.details,
        error.hint,
      );
    }

    return data as any;
  }

  async update(id: string, input: TablesUpdate<T>): Promise<Tables<T>> {
    const supabase = await this.getClient();
    const { data, error } = await (supabase as any)
      .from(this.tableName)
      .update(input)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new DatabaseError(
        `Failed to update ${this.tableName} record: ${id}`,
        error.code,
        error.details,
        error.hint,
      );
    }

    return data as any;
  }

  async delete(id: string): Promise<void> {
    const supabase = await this.getClient();
    const { error } = await (supabase as any).from(this.tableName).delete().eq("id", id);

    if (error) {
      throw new DatabaseError(
        `Failed to delete ${this.tableName} record: ${id}`,
        error.code,
        error.details,
        error.hint,
      );
    }
  }

  async count(filters?: Record<string, any>): Promise<number> {
    const supabase = await this.getClient();
    let query = supabase
      .from(this.tableName)
      .select("*", { count: "exact", head: true });

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    const { count, error } = await query;

    if (error) {
      throw new DatabaseError(
        `Failed to count ${this.tableName} records`,
        error.code,
        error.details,
        error.hint,
      );
    }

    return count || 0;
  }
}

// Specialized service classes for complex operations
export class GameService extends SupabaseService<"games"> {
  constructor(isServer: boolean = false) {
    super("games", isServer);
  }

  async findPublicGames(
    options: {
      limit?: number;
      offset?: number;
      genre?: string;
      search?: string;
    } = {},
  ): Promise<Tables<"games">[]> {
    const supabase = await this.getClient();
    let query = supabase
      .from("games")
      .select(
        `
        *,
        profiles:creator_id(username, display_name, avatar_url)
      `,
      )
      .in("visibility", ["public", "educational"])
      .order("published_at", { ascending: false });

    if (options.genre) {
      query = query.eq("genre", options.genre as any);
    }

    if (options.search) {
      query = query.textSearch("search_vector", options.search);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(
        options.offset,
        options.offset + (options.limit ?? 20) - 1,
      );
    }

    const { data, error } = await query;

    if (error) {
      throw new DatabaseError(
        "Failed to fetch public games",
        error.code,
        error.details,
        error.hint,
      );
    }

    return (data || []) as Tables<"games">[];
  }

  async findUserGames(
    userId: string,
    includePrivate: boolean = true,
  ): Promise<Tables<"games">[]> {
    const supabase = await this.getClient();
    let query = supabase
      .from("games")
      .select("*")
      .eq("creator_id", userId)
      .order("updated_at", { ascending: false });

    if (!includePrivate) {
      query = query.in("visibility", ["public", "educational", "unlisted"]);
    }

    const { data, error } = await query;

    if (error) {
      throw new DatabaseError(
        `Failed to fetch games for user: ${userId}`,
        error.code,
        error.details,
        error.hint,
      );
    }

    return (data || []) as Tables<"games">[];
  }

  async incrementPlayCount(gameId: string): Promise<void> {
    const supabase = await this.getClient();
    const { error } = await (supabase as any).rpc("increment_play_count", {
      game_id: gameId,
    });

    if (error) {
      throw new DatabaseError(
        `Failed to increment play count for game: ${gameId}`,
        error.code,
        error.details,
        error.hint,
      );
    }
  }
}

export class ProfileService extends SupabaseService<"profiles"> {
  constructor(isServer: boolean = false) {
    super("profiles", isServer);
  }

  async findByUsername(username: string): Promise<Tables<"profiles"> | null> {
    const supabase = await this.getClient();
    const { data, error } = await (supabase as any)
      .from("profiles")
      .select("*")
      .eq("username", username)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // Not found
      }
      throw new DatabaseError(
        `Failed to find profile by username: ${username}`,
        error.code,
        error.details,
        error.hint,
      );
    }

    return data as any;
  }

  async updateCredits(
    userId: string,
    creditsUsed: number,
  ): Promise<Tables<"profiles">> {
    const supabase = await this.getClient();

    // Check if we need to reset daily credits
    const { data: profile } = await supabase
      .from("profiles")
      .select("credits_reset_date, credits_used_today")
      .eq("id", userId)
      .single();

    const today = new Date().toISOString().split("T")[0];
    const shouldReset = profile && profile.credits_reset_date !== today;

    const { data, error } = await (supabase as any)
      .from("profiles")
      .update({
        credits_remaining: shouldReset
          ? Math.max(0, 100 - creditsUsed) // Reset to daily limit
          : Math.max(0, (profile?.credits_used_today || 0) - creditsUsed),
        credits_used_today: shouldReset
          ? creditsUsed
          : (profile?.credits_used_today || 0) + creditsUsed,
        credits_reset_date: today,
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      throw new DatabaseError(
        `Failed to update credits for user: ${userId}`,
        error.code,
        error.details,
        error.hint,
      );
    }

    return data as any;
  }
}

// Migration runner
export class MigrationRunner {
  private adminClient = createAdminClient();

  async runMigration(migrationName: string, sql: string): Promise<void> {
    try {
      // Check if migration already ran
      const { data: existingMigration } = await (this.adminClient as any)
        .from("_migration_log")
        .select("migration_name")
        .eq("migration_name", migrationName)
        .single();

      if (existingMigration) {
        console.log(`Migration ${migrationName} already applied`);

        return;
      }

      // Run the migration
      const { error: migrationError } = await (this.adminClient as any).rpc("exec_sql", {
        sql: sql,
      });

      if (migrationError) {
        throw new DatabaseError(
          `Migration ${migrationName} failed`,
          migrationError.code,
          migrationError.details,
          migrationError.hint,
        );
      }

      console.log(`Migration ${migrationName} completed successfully`);
    } catch (error) {
      console.error(`Migration ${migrationName} failed:`, error);
      throw error;
    }
  }

  async runAllMigrations(): Promise<void> {
    // This would read all migration files and run them in order
    // For now, this is a placeholder for the migration system
    console.log("Migration runner ready - implement file reading logic");
  }
}

// Utility functions
export function handleSupabaseError(error: any): DatabaseError {
  return new DatabaseError(
    error.message || "Database operation failed",
    error.code,
    error.details,
    error.hint,
  );
}

export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error: any) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw handleSupabaseError(error);
    }
  };
}

// Connection health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const supabase = createClient();
    const { data, error } = await (supabase as any)
      .from("profiles")
      .select("id")
      .limit(1);

    return !error;
  } catch {
    return false;
  }
}
