-- MeetingMind Platform Row Level Security Policies
-- Migration: 002_rls_policies.sql

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Organizations table policies
CREATE POLICY "Users can view organizations they belong to" ON public.organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id FROM public.user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization owners can update organization" ON public.organizations
  FOR UPDATE USING (
    id IN (
      SELECT organization_id FROM public.user_organizations 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Users can create organizations" ON public.organizations
  FOR INSERT WITH CHECK (created_by = auth.uid());

-- User organizations table policies
CREATE POLICY "Users can view their organization memberships" ON public.user_organizations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Organization owners can manage memberships" ON public.user_organizations
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.user_organizations 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Users can join organizations" ON public.user_organizations
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Meetings table policies
CREATE POLICY "Users can access own meetings" ON public.meetings
  FOR SELECT USING (
    user_id = auth.uid() OR 
    organization_id IN (
      SELECT organization_id FROM public.user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create meetings" ON public.meetings
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own meetings" ON public.meetings
  FOR UPDATE USING (
    user_id = auth.uid() OR 
    organization_id IN (
      SELECT organization_id FROM public.user_organizations 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Users can delete own meetings" ON public.meetings
  FOR DELETE USING (user_id = auth.uid());

-- AI analyses table policies
CREATE POLICY "Users can access analyses for their meetings" ON public.ai_analyses
  FOR SELECT USING (
    user_id = auth.uid() OR
    meeting_id IN (
      SELECT id FROM public.meetings WHERE 
      user_id = auth.uid() OR 
      organization_id IN (
        SELECT organization_id FROM public.user_organizations 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "System can insert AI analyses" ON public.ai_analyses
  FOR INSERT WITH CHECK (
    meeting_id IN (
      SELECT id FROM public.meetings WHERE 
      user_id = auth.uid() OR 
      organization_id IN (
        SELECT organization_id FROM public.user_organizations 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Meeting recordings table policies
CREATE POLICY "Users can access recordings for their meetings" ON public.meeting_recordings
  FOR SELECT USING (
    user_id = auth.uid() OR
    meeting_id IN (
      SELECT id FROM public.meetings WHERE 
      user_id = auth.uid() OR 
      organization_id IN (
        SELECT organization_id FROM public.user_organizations 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create recordings for their meetings" ON public.meeting_recordings
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    meeting_id IN (
      SELECT id FROM public.meetings WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own recordings" ON public.meeting_recordings
  FOR DELETE USING (user_id = auth.uid());

-- Meeting insights table policies
CREATE POLICY "Users can access insights for their meetings" ON public.meeting_insights
  FOR SELECT USING (
    user_id = auth.uid() OR
    meeting_id IN (
      SELECT id FROM public.meetings WHERE 
      user_id = auth.uid() OR 
      organization_id IN (
        SELECT organization_id FROM public.user_organizations 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "System can insert meeting insights" ON public.meeting_insights
  FOR INSERT WITH CHECK (
    meeting_id IN (
      SELECT id FROM public.meetings WHERE 
      user_id = auth.uid() OR 
      organization_id IN (
        SELECT organization_id FROM public.user_organizations 
        WHERE user_id = auth.uid()
      )
    )
  );

-- User integrations table policies
CREATE POLICY "Users can manage own integrations" ON public.user_integrations
  FOR ALL USING (user_id = auth.uid());

-- Subscriptions table policies
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT USING (
    user_id = auth.uid() OR
    organization_id IN (
      SELECT organization_id FROM public.user_organizations 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Users can create own subscriptions" ON public.subscriptions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own subscriptions" ON public.subscriptions
  FOR UPDATE USING (user_id = auth.uid());

-- Usage analytics table policies
CREATE POLICY "Users can view own usage analytics" ON public.usage_analytics
  FOR SELECT USING (
    user_id = auth.uid() OR
    organization_id IN (
      SELECT organization_id FROM public.user_organizations 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "System can insert usage analytics" ON public.usage_analytics
  FOR INSERT WITH CHECK (TRUE); -- Allow system to insert analytics

-- Billing usage table policies
CREATE POLICY "Users can view own billing usage" ON public.billing_usage
  FOR SELECT USING (
    user_id = auth.uid() OR
    subscription_id IN (
      SELECT id FROM public.subscriptions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage billing usage" ON public.billing_usage
  FOR ALL WITH CHECK (TRUE); -- Allow system to manage billing

-- Feedback table policies
CREATE POLICY "Users can manage own feedback" ON public.feedback
  FOR ALL USING (user_id = auth.uid());

-- Create helper functions for common queries
CREATE OR REPLACE FUNCTION public.get_user_organizations(user_uuid UUID)
RETURNS TABLE(organization_id UUID, role TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT uo.organization_id, uo.role
  FROM public.user_organizations uo
  WHERE uo.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.user_has_organization_access(user_uuid UUID, org_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM public.user_organizations
    WHERE user_id = user_uuid AND organization_id = org_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.user_can_access_meeting(user_uuid UUID, meeting_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM public.meetings m
    WHERE m.id = meeting_uuid AND (
      m.user_id = user_uuid OR
      m.organization_id IN (
        SELECT organization_id FROM public.user_organizations
        WHERE user_id = user_uuid
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
