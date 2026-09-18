export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type VolunteerStatus = "active" | "inactive" | "pending" | "suspended";
export type EventStatus = "upcoming" | "ongoing" | "completed" | "cancelled";
export type AttendanceStatus = "present" | "absent" | "late";
export type AppRole = "volunteer" | "coordinator" | "admin" | "ngo_admin" | "strategic_partner";
export type RegistrationStatus = "pending" | "approved" | "rejected" | "cancelled" | "waitlisted";
export type TaskAssignmentStatus = "assigned" | "accepted" | "declined" | "completed" | "cancelled";
export type AttendanceMethod = "manual" | "event_qr" | "volunteer_qr" | "offline_sync";
export type QrPurpose = "check_in" | "check_out" | "attendance";
export type ScanAction = "check_in" | "check_out";
export type ScanResult = "success" | "duplicate" | "ineligible" | "expired" | "invalid" | "error";
export type AnnouncementAudience =
  | "public"
  | "all_volunteers"
  | "registered_volunteers"
  | "approved_volunteers"
  | "admins";
export type MessageVisibility = "event" | "admin_only";

type Relationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

type TableDefinition<
  Row,
  Insert = Partial<Row>,
  Update = Partial<Insert>,
  Relationships extends Relationship[] = [],
> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: Relationships;
};

type ViewDefinition<Row, Relationships extends Relationship[] = []> = {
  Row: Row;
  Relationships: Relationships;
};

export type VolunteerRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  skills: string | null;
  status: VolunteerStatus | string | null;
  created_at: string | null;
  auth_user_id: string | null;
  avatar_url: string | null;
  updated_at: string | null;
};

export type EventRow = {
  id: string;
  event_name: string | null;
  description: string | null;
  location: string | null;
  start_time: string | null;
  end_time: string | null;
  status: EventStatus | string | null;
  created_at: string | null;
  updated_at: string | null;
  task_requirements: string | null;
  skills_required: string[] | null;
  volunteer_slots: number | null;
  registration_opens_at: string | null;
  registration_closes_at: string | null;
  coordinator_name: string | null;
  coordinator_contact: string | null;
  instructions: string | null;
  certificate_title: string | null;
  certificate_threshold_minutes: number | null;
};

export type AttendanceRow = {
  id: string;
  volunteer_id: string | null;
  event_id: string | null;
  check_in: string | null;
  check_out: string | null;
  status: AttendanceStatus | string | null;
  created_at: string | null;
  updated_at: string | null;
  checked_in_by: string | null;
  checked_out_by: string | null;
  check_in_method: AttendanceMethod | string | null;
  check_out_method: AttendanceMethod | string | null;
  offline_sync_id: string | null;
  notes: string | null;
};

export type Database = {
  public: {
    Tables: {
      volunteers: TableDefinition<
        VolunteerRow,
        {
          id?: string;
          full_name?: string | null;
          email?: string | null;
          phone?: string | null;
          city?: string | null;
          skills?: string | null;
          status?: VolunteerStatus | string | null;
          created_at?: string | null;
          auth_user_id?: string | null;
          avatar_url?: string | null;
          updated_at?: string | null;
        }
      >;
      events: TableDefinition<
        EventRow,
        {
          id?: string;
          event_name?: string | null;
          description?: string | null;
          location?: string | null;
          start_time?: string | null;
          end_time?: string | null;
          status?: EventStatus | string | null;
          created_at?: string | null;
          updated_at?: string | null;
          task_requirements?: string | null;
          skills_required?: string[] | null;
          volunteer_slots?: number | null;
          registration_opens_at?: string | null;
          registration_closes_at?: string | null;
          coordinator_name?: string | null;
          coordinator_contact?: string | null;
          instructions?: string | null;
          certificate_title?: string | null;
          certificate_threshold_minutes?: number | null;
        }
      >;
      attendance: TableDefinition<
        AttendanceRow,
        {
          id?: string;
          volunteer_id?: string | null;
          event_id?: string | null;
          check_in?: string | null;
          check_out?: string | null;
          status?: AttendanceStatus | string | null;
          created_at?: string | null;
          updated_at?: string | null;
          checked_in_by?: string | null;
          checked_out_by?: string | null;
          check_in_method?: AttendanceMethod | string | null;
          check_out_method?: AttendanceMethod | string | null;
          offline_sync_id?: string | null;
          notes?: string | null;
        },
        Partial<AttendanceRow>,
        [
          {
            foreignKeyName: "attendance_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_volunteer_id_fkey";
            columns: ["volunteer_id"];
            isOneToOne: false;
            referencedRelation: "volunteers";
            referencedColumns: ["id"];
          },
        ]
      >;
      user_roles: TableDefinition<{
        id: string;
        user_id: string;
        role: AppRole;
        created_at: string;
      }, {
        id?: string;
        user_id: string;
        role?: AppRole;
        created_at?: string;
      }>;
      event_registrations: TableDefinition<{
        id: string;
        event_id: string;
        volunteer_id: string;
        status: RegistrationStatus;
        registered_at: string;
        updated_at: string | null;
        reviewed_by: string | null;
        reviewed_at: string | null;
        notes: string | null;
      }, {
        id?: string;
        event_id: string;
        volunteer_id: string;
        status?: RegistrationStatus;
        registered_at?: string;
        updated_at?: string | null;
        reviewed_by?: string | null;
        reviewed_at?: string | null;
        notes?: string | null;
      }>;
      event_tasks: TableDefinition<{
        id: string;
        event_id: string;
        title: string;
        description: string | null;
        skills_required: string[] | null;
        slots: number | null;
        starts_at: string | null;
        ends_at: string | null;
        created_at: string;
        updated_at: string | null;
      }, {
        id?: string;
        event_id: string;
        title: string;
        description?: string | null;
        skills_required?: string[] | null;
        slots?: number | null;
        starts_at?: string | null;
        ends_at?: string | null;
        created_at?: string;
        updated_at?: string | null;
      }>;
      task_assignments: TableDefinition<{
        id: string;
        task_id: string;
        volunteer_id: string;
        registration_id: string | null;
        status: TaskAssignmentStatus;
        assigned_by: string | null;
        assigned_at: string;
        updated_at: string | null;
      }, {
        id?: string;
        task_id: string;
        volunteer_id: string;
        registration_id?: string | null;
        status?: TaskAssignmentStatus;
        assigned_by?: string | null;
        assigned_at?: string;
        updated_at?: string | null;
      }>;
      volunteer_qr_tokens: TableDefinition<{
        id: string;
        volunteer_id: string;
        token_hash: string;
        label: string | null;
        expires_at: string | null;
        revoked_at: string | null;
        created_at: string;
      }, {
        id?: string;
        volunteer_id: string;
        token_hash: string;
        label?: string | null;
        expires_at?: string | null;
        revoked_at?: string | null;
        created_at?: string;
      }>;
      event_qr_tokens: TableDefinition<{
        id: string;
        event_id: string;
        token_hash: string;
        purpose: QrPurpose;
        starts_at: string;
        expires_at: string;
        created_by: string | null;
        revoked_at: string | null;
        created_at: string;
      }, {
        id?: string;
        event_id: string;
        token_hash: string;
        purpose?: QrPurpose;
        starts_at?: string;
        expires_at: string;
        created_by?: string | null;
        revoked_at?: string | null;
        created_at?: string;
      }>;
      attendance_scan_logs: TableDefinition<{
        id: string;
        event_id: string | null;
        volunteer_id: string | null;
        attendance_id: string | null;
        action: ScanAction;
        scan_source: AttendanceMethod;
        token_id: string | null;
        scanned_by: string | null;
        offline_sync_id: string | null;
        result: ScanResult;
        message: string | null;
        created_at: string;
      }, {
        id?: string;
        event_id?: string | null;
        volunteer_id?: string | null;
        attendance_id?: string | null;
        action: ScanAction;
        scan_source: AttendanceMethod;
        token_id?: string | null;
        scanned_by?: string | null;
        offline_sync_id?: string | null;
        result: ScanResult;
        message?: string | null;
        created_at?: string;
      }>;
      certificates: TableDefinition<{
        id: string;
        certificate_id: string;
        volunteer_id: string;
        event_id: string;
        attendance_id: string | null;
        title: string;
        organization_name: string;
        volunteer_name: string;
        event_name: string;
        event_date: string | null;
        hours: number;
        issued_at: string;
        issued_by: string | null;
        verification_code: string;
        pdf_storage_path: string | null;
        revoked_at: string | null;
        revoked_by: string | null;
        revoke_reason: string | null;
        metadata: Json;
      }, {
        id?: string;
        certificate_id: string;
        volunteer_id: string;
        event_id: string;
        attendance_id?: string | null;
        title: string;
        organization_name?: string;
        volunteer_name: string;
        event_name: string;
        event_date?: string | null;
        hours?: number;
        issued_at?: string;
        issued_by?: string | null;
        verification_code: string;
        pdf_storage_path?: string | null;
        revoked_at?: string | null;
        revoked_by?: string | null;
        revoke_reason?: string | null;
        metadata?: Json;
      }>;
      announcements: TableDefinition<{
        id: string;
        event_id: string | null;
        title: string;
        body: string;
        audience: AnnouncementAudience;
        published_at: string | null;
        created_by: string | null;
        created_at: string;
        updated_at: string | null;
      }, {
        id?: string;
        event_id?: string | null;
        title: string;
        body: string;
        audience?: AnnouncementAudience;
        published_at?: string | null;
        created_by?: string | null;
        created_at?: string;
        updated_at?: string | null;
      }>;
      messages: TableDefinition<{
        id: string;
        event_id: string | null;
        parent_message_id: string | null;
        sender_user_id: string;
        volunteer_id: string | null;
        body: string;
        visibility: MessageVisibility;
        created_at: string;
        updated_at: string | null;
        deleted_at: string | null;
      }, {
        id?: string;
        event_id?: string | null;
        parent_message_id?: string | null;
        sender_user_id: string;
        volunteer_id?: string | null;
        body: string;
        visibility?: MessageVisibility;
        created_at?: string;
        updated_at?: string | null;
        deleted_at?: string | null;
      }>;
      notifications: TableDefinition<{
        id: string;
        user_id: string | null;
        volunteer_id: string | null;
        type: string;
        title: string;
        body: string | null;
        data: Json;
        read_at: string | null;
        created_at: string;
      }, {
        id?: string;
        user_id?: string | null;
        volunteer_id?: string | null;
        type: string;
        title: string;
        body?: string | null;
        data?: Json;
        read_at?: string | null;
        created_at?: string;
      }>;
      badges: TableDefinition<{
        id: string;
        code: string;
        name: string;
        description: string | null;
        criteria: Json;
        icon_name: string | null;
        is_active: boolean;
        created_at: string;
      }, {
        id?: string;
        code: string;
        name: string;
        description?: string | null;
        criteria?: Json;
        icon_name?: string | null;
        is_active?: boolean;
        created_at?: string;
      }>;
      volunteer_badges: TableDefinition<{
        id: string;
        volunteer_id: string;
        badge_id: string;
        earned_at: string;
        awarded_by: string | null;
        evidence: Json;
      }, {
        id?: string;
        volunteer_id: string;
        badge_id: string;
        earned_at?: string;
        awarded_by?: string | null;
        evidence?: Json;
      }>;
    };
    Views: {
      volunteer_impact_summary: ViewDefinition<{
        volunteer_id: string | null;
        events_registered: number | null;
        events_attended: number | null;
        total_minutes: number | null;
        total_hours: number | null;
        certificates_earned: number | null;
        badges_earned: number | null;
      }>;
      event_participation_summary: ViewDefinition<{
        event_id: string | null;
        total_registrations: number | null;
        approved_registrations: number | null;
        waitlisted_registrations: number | null;
        attended_count: number | null;
        total_minutes: number | null;
        total_hours: number | null;
        available_slots: number | null;
      }>;
    };
    Functions: {
      attendance_minutes: {
        Args: {
          check_in_at: string | null;
          check_out_at: string | null;
        };
        Returns: number;
      };
      can_access_event_discussion: {
        Args: {
          target_event_id: string;
        };
        Returns: boolean;
      };
      current_volunteer_id: {
        Args: Record<PropertyKey, never>;
        Returns: string | null;
      };
      has_app_role: {
        Args: {
          required_roles: string[];
        };
        Returns: boolean;
      };
      is_current_volunteer: {
        Args: {
          volunteer: string;
        };
        Returns: boolean;
      };
      mark_all_notifications_read: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      mark_notification_read: {
        Args: {
          notification: string;
        };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
