-- ==============================================================================
-- SCHÉMA COMPLET BASE DE DONNÉES POSTGRESQL / SUPABASE — PLATEFORME DE LIVRAISON
-- ==============================================================================
-- Fichier d'exécution globale pour le Supabase SQL Editor
-- Inclus : ENUMs, 17 Tables, Foreign Keys, Indexes, Triggers, RLS Policies,
-- Storage Bucket Setup, et Automation d'inscription (auth.users -> profiles).
-- ==============================================================================

-- 0. EXTENSIONS POSTGRESQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. TYPES ENUM & CHECK CONSTRAINTS
-- ==============================================================================

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('client', 'livreur', 'commerçant', 'entreprise', 'admin');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE doc_type AS ENUM ('identity_card', 'driver_license', 'vehicle_document', 'other');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE doc_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE driver_availability AS ENUM ('offline', 'available', 'busy');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE request_status AS ENUM (
        'open', 'proposals_received', 'driver_selected', 
        'accepted', 'picked_up', 'in_transit', 'delivered', 
        'cancelled', 'disputed'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE proposal_status AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE delivery_status AS ENUM (
        'assigned', 'accepted', 'picked_up', 
        'in_transit', 'delivered', 'cancelled', 'disputed'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'successful', 'failed', 'refunded', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE notif_channel AS ENUM ('in_app', 'email', 'whatsapp', 'sms');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE ticket_priority AS ENUM ('low', 'normal', 'high', 'urgent');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ==============================================================================
-- 2. DÉFINITION DES TABLES
-- ==============================================================================

-- 2.1 TABLE profiles (Liée à auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'client',
    status user_status NOT NULL DEFAULT 'pending',
    address TEXT,
    city TEXT DEFAULT 'Ouagadougou',
    neighborhood TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.2 TABLE user_documents (Vérifications KYC)
CREATE TABLE IF NOT EXISTS public.user_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    document_type doc_type NOT NULL,
    document_url TEXT NOT NULL,
    status doc_status NOT NULL DEFAULT 'pending',
    rejection_reason TEXT,
    verified_by UUID REFERENCES public.profiles(id),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.3 TABLE driver_profiles (Spécifique aux Livreurs)
CREATE TABLE IF NOT EXISTS public.driver_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    vehicle_type TEXT,
    vehicle_brand TEXT,
    vehicle_model TEXT,
    vehicle_registration TEXT,
    driver_license_number TEXT,
    availability_status driver_availability NOT NULL DEFAULT 'offline',
    verification_status user_status NOT NULL DEFAULT 'pending',
    rating NUMERIC(3,2) DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 5.00),
    total_deliveries INTEGER DEFAULT 0 CHECK (total_deliveries >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.4 TABLE business_profiles (Spécifique aux Boutiques et Entreprises)
CREATE TABLE IF NOT EXISTS public.business_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    business_type TEXT,
    business_phone TEXT,
    business_email TEXT,
    business_address TEXT,
    city TEXT DEFAULT 'Ouagadougou',
    neighborhood TEXT,
    registration_number TEXT,
    logo_url TEXT,
    verification_status user_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.5 TABLE delivery_requests (Demandes de livraisons)
CREATE TABLE IF NOT EXISTS public.delivery_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    pickup_address TEXT NOT NULL,
    pickup_city TEXT DEFAULT 'Ouagadougou',
    pickup_neighborhood TEXT,
    delivery_address TEXT NOT NULL,
    delivery_city TEXT DEFAULT 'Ouagadougou',
    delivery_neighborhood TEXT,
    package_description TEXT,
    package_type TEXT,
    package_weight NUMERIC(8,2),
    package_value NUMERIC(12,2),
    proposed_price NUMERIC(10,2),
    delivery_fee NUMERIC(10,2),
    notes TEXT,
    status request_status NOT NULL DEFAULT 'open',
    selected_driver_id UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.6 TABLE delivery_proposals (Propositions de prix émises par les livreurs)
CREATE TABLE IF NOT EXISTS public.delivery_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_request_id UUID NOT NULL REFERENCES public.delivery_requests(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    proposed_price NUMERIC(10,2) NOT NULL CHECK (proposed_price > 0),
    estimated_time INTEGER, -- en minutes
    message TEXT,
    status proposal_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_active_driver_proposal UNIQUE (delivery_request_id, driver_id)
);

-- 2.7 TABLE deliveries (Livraison active une fois le livreur sélectionné)
CREATE TABLE IF NOT EXISTS public.deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_request_id UUID UNIQUE NOT NULL REFERENCES public.delivery_requests(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES public.profiles(id),
    client_id UUID NOT NULL REFERENCES public.profiles(id),
    status delivery_status NOT NULL DEFAULT 'assigned',
    pickup_at TIMESTAMPTZ,
    picked_up_at TIMESTAMPTZ,
    in_transit_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.8 TABLE delivery_tracking (Historique GPS & Localisations)
CREATE TABLE IF NOT EXISTS public.delivery_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_id UUID NOT NULL REFERENCES public.deliveries(id) ON DELETE CASCADE,
    latitude NUMERIC(10,8) NOT NULL,
    longitude NUMERIC(11,8) NOT NULL,
    status delivery_status,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.9 TABLE delivery_status_history (Horodatage des changements d'état)
CREATE TABLE IF NOT EXISTS public.delivery_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_id UUID NOT NULL REFERENCES public.deliveries(id) ON DELETE CASCADE,
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_by UUID REFERENCES public.profiles(id),
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.10 TABLE payments (Historique des règlements)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_id UUID REFERENCES public.deliveries(id) ON DELETE SET NULL,
    payer_id UUID NOT NULL REFERENCES public.profiles(id),
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    currency TEXT DEFAULT 'XOF',
    payment_method TEXT NOT NULL, -- Orange Money, Moov Money, Wave, Cash
    transaction_reference TEXT UNIQUE,
    status payment_status NOT NULL DEFAULT 'pending',
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.11 TABLE notifications (Système centralisé multi-canal)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    channel notif_channel NOT NULL DEFAULT 'in_app',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.12 TABLE admin_actions (Journal d'audit des interventions administrateurs)
CREATE TABLE IF NOT EXISTS public.admin_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES public.profiles(id),
    target_user_id UUID REFERENCES public.profiles(id),
    action TEXT NOT NULL,
    reason TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.13 TABLE support_tickets (Gestion du support client & litiges)
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    delivery_id UUID REFERENCES public.deliveries(id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    priority ticket_priority NOT NULL DEFAULT 'normal',
    status ticket_status NOT NULL DEFAULT 'open',
    assigned_admin_id UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.14 TABLE support_messages (Discussion liée aux tickets de support)
CREATE TABLE IF NOT EXISTS public.support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id),
    message TEXT NOT NULL,
    attachment_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.15 TABLE reviews (Notes et évaluations post-livraison)
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_id UUID NOT NULL REFERENCES public.deliveries(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES public.profiles(id),
    reviewed_user_id UUID NOT NULL REFERENCES public.profiles(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_delivery_review_per_reviewer UNIQUE (delivery_id, reviewer_id)
);

-- 2.16 TABLE addresses (Carnet d'adresses enregistrées par l'utilisateur)
CREATE TABLE IF NOT EXISTS public.addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    label TEXT,
    address TEXT NOT NULL,
    city TEXT DEFAULT 'Ouagadougou',
    neighborhood TEXT,
    latitude NUMERIC(10,8),
    longitude NUMERIC(11,8),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.17 TABLE audit_logs (Journal de sécurité système)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    table_name TEXT,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 3. INDEXES DE PERFORMANCE ET D'OPTIMISATION
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);

CREATE INDEX IF NOT EXISTS idx_delivery_requests_status ON public.delivery_requests(status);
CREATE INDEX IF NOT EXISTS idx_delivery_requests_client ON public.delivery_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_delivery_requests_driver ON public.delivery_requests(selected_driver_id);

CREATE INDEX IF NOT EXISTS idx_delivery_proposals_request ON public.delivery_proposals(delivery_request_id);
CREATE INDEX IF NOT EXISTS idx_delivery_proposals_driver ON public.delivery_proposals(driver_id);

CREATE INDEX IF NOT EXISTS idx_deliveries_driver ON public.deliveries(driver_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_client ON public.deliveries(client_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON public.deliveries(status);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(is_read);

CREATE INDEX IF NOT EXISTS idx_delivery_tracking_delivery ON public.delivery_tracking(delivery_id);
CREATE INDEX IF NOT EXISTS idx_status_history_delivery ON public.delivery_status_history(delivery_id);

-- ==============================================================================
-- 4. FONCTIONS HELPER ET FONCTIONS DE SÉCURITÉ
-- ==============================================================================

-- 4.1 Vérifie si l'utilisateur connecté est Administrateur
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4.2 Vérifie si l'utilisateur connecté est Approuvé
CREATE OR REPLACE FUNCTION public.is_approved_user()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND status = 'approved'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4.3 Trigger Mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Application du trigger updated_at sur toutes les tables concernées
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_driver_profiles_updated_at ON public.driver_profiles;
CREATE TRIGGER trg_driver_profiles_updated_at BEFORE UPDATE ON public.driver_profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_business_profiles_updated_at ON public.business_profiles;
CREATE TRIGGER trg_business_profiles_updated_at BEFORE UPDATE ON public.business_profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_delivery_requests_updated_at ON public.delivery_requests;
CREATE TRIGGER trg_delivery_requests_updated_at BEFORE UPDATE ON public.delivery_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_deliveries_updated_at ON public.deliveries;
CREATE TRIGGER trg_deliveries_updated_at BEFORE UPDATE ON public.deliveries FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_support_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER trg_support_tickets_updated_at BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ==============================================================================
-- 5. TRIGGER AUTOMATION : INSCRIPTION (auth.users -> profiles)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    assigned_role public.user_role := 'client';
    raw_role TEXT;
    user_fullname TEXT;
    user_phone TEXT;
BEGIN
    -- Récupération du rôle demandé dans raw_user_meta_data
    raw_role := LOWER(COALESCE(NEW.raw_user_meta_data->>'role', 'client'));
    
    -- Empêcher la création directe du rôle admin via l'API publique d'inscription
    IF raw_role = 'admin' THEN
        assigned_role := 'client';
    ELSIF raw_role IN ('livreur', 'commerçant', 'entreprise', 'client') THEN
        assigned_role := raw_role::public.user_role;
    ELSE
        assigned_role := 'client';
    END IF;

    user_fullname := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Utilisateur');
    user_phone := COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone, 'Non renseigné');

    -- Insertion dans public.profiles (Statut par défaut = pending)
    INSERT INTO public.profiles (
        id,
        full_name,
        email,
        phone,
        avatar_url,
        role,
        status,
        address,
        city,
        neighborhood
    ) VALUES (
        NEW.id,
        user_fullname,
        NEW.email,
        user_phone,
        NEW.raw_user_meta_data->>'avatar_url',
        assigned_role,
        'pending',
        NEW.raw_user_meta_data->>'address',
        COALESCE(NEW.raw_user_meta_data->>'city', 'Ouagadougou'),
        NEW.raw_user_meta_data->>'neighborhood'
    );

    -- Si Livreur, créer la fiche profil livreur associée
    IF assigned_role = 'livreur' THEN
        INSERT INTO public.driver_profiles (
            user_id,
            vehicle_type,
            vehicle_brand,
            vehicle_model,
            vehicle_registration,
            verification_status
        ) VALUES (
            NEW.id,
            NEW.raw_user_meta_data->>'vehicle_type',
            NEW.raw_user_meta_data->>'vehicle_brand',
            NEW.raw_user_meta_data->>'vehicle_model',
            NEW.raw_user_meta_data->>'vehicle_registration',
            'pending'
        );
    END IF;

    -- Si Commerçant ou Entreprise, créer la fiche business associée
    IF assigned_role IN ('commerçant', 'entreprise') THEN
        INSERT INTO public.business_profiles (
            user_id,
            business_name,
            business_type,
            business_phone,
            business_email,
            verification_status
        ) VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'business_name', user_fullname),
            NEW.raw_user_meta_data->>'business_type',
            user_phone,
            NEW.email,
            'pending'
        );
    END IF;

    -- Création d'une notification administrateur en base
    INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        channel
    )
    SELECT
        p.id,
        'new_registration',
        '🔔 NOUVELLE INSCRIPTION À VALIDER',
        'Le candidat ' || user_fullname || ' (' || assigned_role::text || ', Tél: ' || user_phone || ') s''est inscrit et attend votre validation.',
        'in_app'
    FROM public.profiles p
    WHERE p.role = 'admin';

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger d'écoute sur la table auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 6. POLITIQUES RLS (ROW LEVEL SECURITY)
-- ==============================================================================

-- Activation RLS sur TOUTES les tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 6.1 POLITIQUES : PROFILES
DROP POLICY IF EXISTS "Lecture des profils pour utilisateurs authentifiés" ON public.profiles;
CREATE POLICY "Lecture des profils pour utilisateurs authentifiés"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Modification de son propre profil" ON public.profiles;
CREATE POLICY "Modification de son propre profil"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (
        id = auth.uid() 
        AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()) -- Interdit de modifier son rôle
        AND status = (SELECT status FROM public.profiles WHERE id = auth.uid()) -- Interdit de modifier son statut
    );

DROP POLICY IF EXISTS "Admin full control sur profiles" ON public.profiles;
CREATE POLICY "Admin full control sur profiles"
    ON public.profiles FOR ALL
    TO authenticated
    USING (public.is_admin());

-- 6.2 POLITIQUES : USER_DOCUMENTS
DROP POLICY IF EXISTS "Consultation de ses propres documents" ON public.user_documents;
CREATE POLICY "Consultation de ses propres documents"
    ON public.user_documents FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Insertion de ses propres documents" ON public.user_documents;
CREATE POLICY "Insertion de ses propres documents"
    ON public.user_documents FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admin modifie documents" ON public.user_documents;
CREATE POLICY "Admin modifie documents"
    ON public.user_documents FOR UPDATE
    TO authenticated
    USING (public.is_admin());

-- 6.3 POLITIQUES : DRIVER_PROFILES
DROP POLICY IF EXISTS "Lecture profils livreurs" ON public.driver_profiles;
CREATE POLICY "Lecture profils livreurs"
    ON public.driver_profiles FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Livreur modifie sa disponibilite" ON public.driver_profiles;
CREATE POLICY "Livreur modifie sa disponibilite"
    ON public.driver_profiles FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (
        user_id = auth.uid()
        AND verification_status = (SELECT verification_status FROM public.driver_profiles WHERE user_id = auth.uid())
    );

-- 6.4 POLITIQUES : DELIVERY_REQUESTS
DROP POLICY IF EXISTS "Client voit ses propres demandes" ON public.delivery_requests;
CREATE POLICY "Client voit ses propres demandes"
    ON public.delivery_requests FOR SELECT
    TO authenticated
    USING (client_id = auth.uid() OR public.is_admin() OR (status = 'open' AND public.is_approved_user()));

DROP POLICY IF EXISTS "Client cree demande si approuve" ON public.delivery_requests;
CREATE POLICY "Client cree demande si approuve"
    ON public.delivery_requests FOR INSERT
    TO authenticated
    WITH CHECK (client_id = auth.uid() AND public.is_approved_user());

DROP POLICY IF EXISTS "Client modifie/sélectionne sur sa demande" ON public.delivery_requests;
CREATE POLICY "Client modifie/sélectionne sur sa demande"
    ON public.delivery_requests FOR UPDATE
    TO authenticated
    USING (client_id = auth.uid() OR public.is_admin());

-- 6.5 POLITIQUES : DELIVERY_PROPOSALS
DROP POLICY IF EXISTS "Lecture propositions" ON public.delivery_proposals;
CREATE POLICY "Lecture propositions"
    ON public.delivery_proposals FOR SELECT
    TO authenticated
    USING (
        driver_id = auth.uid() 
        OR public.is_admin() 
        OR EXISTS (
            SELECT 1 FROM public.delivery_requests dr
            WHERE dr.id = delivery_request_id AND dr.client_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Livreur propose uniquement si approuve et disponible" ON public.delivery_proposals;
CREATE POLICY "Livreur propose uniquement si approuve et disponible"
    ON public.delivery_proposals FOR INSERT
    TO authenticated
    WITH CHECK (
        driver_id = auth.uid() 
        AND public.is_approved_user()
        AND EXISTS (
            SELECT 1 FROM public.driver_profiles dp
            WHERE dp.user_id = auth.uid() AND dp.availability_status = 'available'
        )
    );

-- 6.6 POLITIQUES : DELIVERIES
DROP POLICY IF EXISTS "Lecture livraisons attribuees" ON public.deliveries;
CREATE POLICY "Lecture livraisons attribuees"
    ON public.deliveries FOR SELECT
    TO authenticated
    USING (client_id = auth.uid() OR driver_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Mise a jour statut livraison" ON public.deliveries;
CREATE POLICY "Mise a jour statut livraison"
    ON public.deliveries FOR UPDATE
    TO authenticated
    USING (client_id = auth.uid() OR driver_id = auth.uid() OR public.is_admin());

-- 6.7 POLITIQUES : DELIVERY_TRACKING (GPS Privé)
DROP POLICY IF EXISTS "Tracking GPS consulte par parties autorisees" ON public.delivery_tracking;
CREATE POLICY "Tracking GPS consulte par parties autorisees"
    ON public.delivery_tracking FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.deliveries d
            WHERE d.id = delivery_id AND (d.client_id = auth.uid() OR d.driver_id = auth.uid())
        )
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "Livreur insere son GPS" ON public.delivery_tracking;
CREATE POLICY "Livreur insere son GPS"
    ON public.delivery_tracking FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.deliveries d
            WHERE d.id = delivery_id AND d.driver_id = auth.uid()
        )
    );

-- 6.8 POLITIQUES : NOTIFICATIONS
DROP POLICY IF EXISTS "Utilisateur voit ses notifications" ON public.notifications;
CREATE POLICY "Utilisateur voit ses notifications"
    ON public.notifications FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Utilisateur marque sa notification lue" ON public.notifications;
CREATE POLICY "Utilisateur marque sa notification lue"
    ON public.notifications FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

-- 6.9 POLITIQUES : ADMIN ACTIONS & AUDIT LOGS
DROP POLICY IF EXISTS "Admin consulte admin_actions" ON public.admin_actions;
CREATE POLICY "Admin consulte admin_actions"
    ON public.admin_actions FOR ALL
    TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "Admin consulte audit_logs" ON public.audit_logs;
CREATE POLICY "Admin consulte audit_logs"
    ON public.audit_logs FOR ALL
    TO authenticated
    USING (public.is_admin());

-- ==============================================================================
-- 7. CONFIGURATION ET POLITIQUES SUPABASE STORAGE BUCKETS
-- ==============================================================================

-- Insertion des 5 Buckets Privés dans storage.buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('avatars', 'avatars', true),
    ('identity_documents', 'identity_documents', false),
    ('driver_documents', 'driver_documents', false),
    ('business_documents', 'business_documents', false),
    ('delivery_attachments', 'delivery_attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Politiques de sécurité Storage sur storage.objects
DROP POLICY IF EXISTS "Lecture des Avatars" ON storage.objects;
CREATE POLICY "Lecture des Avatars" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Upload d'Avatar par son propriétaire" ON storage.objects;
CREATE POLICY "Upload d'Avatar par son propriétaire" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Documents Privés consultables uniquement par Propriétaire ou Admin" ON storage.objects;
CREATE POLICY "Documents Privés consultables uniquement par Propriétaire ou Admin" ON storage.objects FOR SELECT TO authenticated USING (
    bucket_id IN ('identity_documents', 'driver_documents', 'business_documents', 'delivery_attachments') 
    AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin())
);

DROP POLICY IF EXISTS "Upload Documents Privés par Propriétaire" ON storage.objects;
CREATE POLICY "Upload Documents Privés par Propriétaire" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
    bucket_id IN ('identity_documents', 'driver_documents', 'business_documents', 'delivery_attachments') 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ==============================================================================
-- FIN DU SCRIPT SQL DE CONFIGURATION BASE DE DONNÉES SUPABASE
-- ==============================================================================
