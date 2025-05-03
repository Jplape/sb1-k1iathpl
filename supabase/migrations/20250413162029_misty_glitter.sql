/*
  # Add Task Management System Schema

  1. New Tables
    - tasks
      - Core task information and metadata
      - Includes status tracking and deadlines
    - projects
      - Project organization structure
      - Links tasks and users
    - collaborators
      - Manages project access and roles
      - Links users to projects

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Role-based access control
*/

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'archived')),
  created_at timestamptz DEFAULT now(),
  due_date timestamptz,
  project_id uuid,
  assigned_to uuid REFERENCES auth.users(id),
  created_by uuid REFERENCES auth.users(id),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  tags text[] DEFAULT ARRAY[]::text[]
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  owner_id uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  status text DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  visibility text DEFAULT 'private' CHECK (visibility IN ('private', 'team', 'public'))
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create collaborators table
CREATE TABLE IF NOT EXISTS collaborators (
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (project_id, user_id)
);

ALTER TABLE collaborators ENABLE ROW LEVEL SECURITY;

-- Add foreign key constraint to tasks
ALTER TABLE tasks ADD CONSTRAINT fk_project
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- RLS Policies

-- Projects policies
CREATE POLICY "Users can view their own and public projects"
  ON projects FOR SELECT
  USING (
    owner_id = auth.uid() OR
    visibility = 'public' OR
    EXISTS (
      SELECT 1 FROM collaborators
      WHERE project_id = projects.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Project owners can update their projects"
  ON projects FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Users can create projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Tasks policies
CREATE POLICY "Users can view tasks they have access to"
  ON tasks FOR SELECT
  USING (
    created_by = auth.uid() OR
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM collaborators
      WHERE project_id = tasks.project_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create tasks in their projects"
  ON tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = project_id AND (
        owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM collaborators
          WHERE project_id = tasks.project_id 
          AND user_id = auth.uid() 
          AND role IN ('owner', 'admin', 'member')
        )
      )
    )
  );

CREATE POLICY "Users can update tasks they have access to"
  ON tasks FOR UPDATE
  USING (
    created_by = auth.uid() OR
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM collaborators
      WHERE project_id = tasks.project_id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'admin', 'member')
    )
  );

-- Collaborators policies
CREATE POLICY "Project owners can manage collaborators"
  ON collaborators FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = project_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can view project collaborators"
  ON collaborators FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = project_id AND (
        owner_id = auth.uid() OR
        visibility IN ('team', 'public') OR
        EXISTS (
          SELECT 1 FROM collaborators c2
          WHERE c2.project_id = collaborators.project_id
          AND c2.user_id = auth.uid()
        )
      )
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_visibility ON projects(visibility);
CREATE INDEX IF NOT EXISTS idx_collaborators_user_id ON collaborators(user_id);