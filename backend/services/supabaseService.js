import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import { mockDatabaseService } from './mockDatabaseService.js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Check if credentials are valid (not default dummies)
const isSupabaseConfigured =
  supabaseUrl &&
  supabaseKey &&
  supabaseUrl !== 'dummy_supabase_url_replace_me' &&
  supabaseKey !== 'dummy_supabase_anon_key_replace_me';

let supabase = null;
if (isSupabaseConfigured) {
  console.log('Supabase credentials detected. Connecting to Supabase...');
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Supabase client initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
  }
} else {
  console.log('No valid Supabase credentials. Backend will run in LOCAL MOCK DATABASE mode.');
}

// Fallback checker if a table is missing in Supabase schema cache
function checkTableMissing(error) {
  if (error && error.code === 'PGRST205') {
    console.warn('⚠️ Supabase tables do not exist in your Supabase schema yet. Automatically falling back to local SQLite database mode.');
    supabase = null; // disable Supabase client for this runtime
    return true;
  }
  return false;
}

// Unified Database Service Dispatcher
export const databaseService = {
  isUsingSupabase() {
    return !!supabase;
  },

  // Complaints
  async saveComplaint(complaint) {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('complaints')
          .insert([{
            id: complaint.id,
            tracking_id: complaint.tracking_id,
            description: complaint.description,
            category: complaint.category,
            urgency: complaint.urgency,
            latitude: complaint.latitude,
            longitude: complaint.longitude,
            photo_url: complaint.photo_url,
            status: complaint.status || 'submitted'
          }])
          .select()
          .single();
        
        if (error) {
          if (checkTableMissing(error)) {
            return mockDatabaseService.saveComplaint(complaint);
          }
          console.error('Supabase saveComplaint error:', error);
          throw error;
        }
        return data;
      } catch (err) {
        if (err.code === 'PGRST205' || (err.message && err.message.includes('chat_sessions'))) {
          supabase = null;
          return mockDatabaseService.saveComplaint(complaint);
        }
        throw err;
      }
    } else {
      return mockDatabaseService.saveComplaint(complaint);
    }
  },

  async getComplaintByTrackingId(trackingId) {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('complaints')
          .select('*')
          .eq('tracking_id', trackingId)
          .maybeSingle();

        if (error) {
          if (checkTableMissing(error)) {
            return mockDatabaseService.getComplaintByTrackingId(trackingId);
          }
          console.error('Supabase getComplaintByTrackingId error:', error);
          throw error;
        }
        return data;
      } catch (err) {
        if (err.code === 'PGRST205') {
          supabase = null;
          return mockDatabaseService.getComplaintByTrackingId(trackingId);
        }
        throw err;
      }
    } else {
      return mockDatabaseService.getComplaintByTrackingId(trackingId);
    }
  },

  async updateComplaintStatus(trackingId, status) {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('complaints')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('tracking_id', trackingId)
          .select()
          .single();

        if (error) {
          if (checkTableMissing(error)) {
            return mockDatabaseService.updateComplaintStatus(trackingId, status);
          }
          console.error('Supabase updateComplaintStatus error:', error);
          throw error;
        }
        return data;
      } catch (err) {
        if (err.code === 'PGRST205') {
          supabase = null;
          return mockDatabaseService.updateComplaintStatus(trackingId, status);
        }
        throw err;
      }
    } else {
      return mockDatabaseService.updateComplaintStatus(trackingId, status);
    }
  },

  async getAllComplaints() {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('complaints')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          if (checkTableMissing(error)) {
            return mockDatabaseService.getAllComplaints();
          }
          console.error('Supabase getAllComplaints error:', error);
          throw error;
        }
        return data || [];
      } catch (err) {
        if (err.code === 'PGRST205') {
          supabase = null;
          return mockDatabaseService.getAllComplaints();
        }
        throw err;
      }
    } else {
      return mockDatabaseService.getAllComplaints();
    }
  },

  // Chat Sessions
  async saveChatSession(id, messages, language) {
    if (supabase) {
      try {
        // Upsert: checks if record with ID exists, updates or inserts
        const { data, error } = await supabase
          .from('chat_sessions')
          .upsert({
            id,
            messages,
            language
          })
          .select()
          .single();

        if (error) {
          if (checkTableMissing(error)) {
            return mockDatabaseService.saveChatSession(id, messages, language);
          }
          console.error('Supabase saveChatSession error:', error);
          throw error;
        }
        return data;
      } catch (err) {
        if (err.code === 'PGRST205') {
          supabase = null;
          return mockDatabaseService.saveChatSession(id, messages, language);
        }
        throw err;
      }
    } else {
      return mockDatabaseService.saveChatSession(id, messages, language);
    }
  },

  async getChatSession(id) {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('chat_sessions')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (error) {
          if (checkTableMissing(error)) {
            return mockDatabaseService.getChatSession(id);
          }
          console.error('Supabase getChatSession error:', error);
          throw error;
        }
        return data;
      } catch (err) {
        if (err.code === 'PGRST205') {
          supabase = null;
          return mockDatabaseService.getChatSession(id);
        }
        throw err;
      }
    } else {
      return mockDatabaseService.getChatSession(id);
    }
  },

  // Schemes (seeding is handled in local DB; on Supabase, they must be pre-seeded in the database)
  async getSchemes() {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('schemes')
          .select('*');

        if (error) {
          if (checkTableMissing(error)) {
            return mockDatabaseService.getSchemes();
          }
          console.error('Supabase getSchemes error:', error);
          throw error;
        }
        return data || [];
      } catch (err) {
        if (err.code === 'PGRST205') {
          supabase = null;
          return mockDatabaseService.getSchemes();
        }
        throw err;
      }
    } else {
      return mockDatabaseService.getSchemes();
    }
  },

  async getSchemeById(id) {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('schemes')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (error) {
          if (checkTableMissing(error)) {
            return mockDatabaseService.getSchemeById(id);
          }
          console.error('Supabase getSchemeById error:', error);
          throw error;
        }
        return data;
      } catch (err) {
        if (err.code === 'PGRST205') {
          supabase = null;
          return mockDatabaseService.getSchemeById(id);
        }
        throw err;
      }
    } else {
      return mockDatabaseService.getSchemeById(id);
    }
  },

  async uploadMedia(file) {
    if (supabase) {
      try {
        const fileBuffer = fs.readFileSync(file.path);
        const filename = file.filename;
        const bucketName = 'complaints';

        // Attempt to create public bucket if missing
        try {
          await supabase.storage.createBucket(bucketName, { 
            public: true,
            allowedMimeTypes: ['image/*', 'video/*']
          });
        } catch (e) {
          // ignore bucket duplicate warning
        }

        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(`photos/${filename}`, fileBuffer, {
            contentType: file.mimetype,
            cacheControl: '3600'
          });

        if (error) throw error;

        const { data: publicUrlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(`photos/${filename}`);

        return publicUrlData.publicUrl;
      } catch (err) {
        console.error('Supabase storage upload error:', err);
        throw err;
      }
    }
    return null;
  }
};
