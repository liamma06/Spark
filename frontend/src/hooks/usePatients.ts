import { useState, useEffect, useCallback } from 'react';
import { patientsApi, alertsApi, timelineApi } from '../lib/api';
import type { Patient, Alert, TimelineEvent } from '../types';

export function usePatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      const data = await patientsApi.getAll();
      setPatients(data);
      setError(null);
    } catch (e) {
      setError('Failed to load patients');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  return { patients, loading, error, refetch: fetchPatients };
}

export function usePatient(patientId: string | null) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientId) {
      setPatient(null);
      setLoading(false);
      return;
    }

    patientsApi.getById(patientId)
      .then(setPatient)
      .catch(() => setPatient(null))
      .finally(() => setLoading(false));
  }, [patientId]);

  return { patient, loading };
}

export function useAlerts(patientId?: string) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const data = patientId 
        ? await alertsApi.getByPatient(patientId)
        : await alertsApi.getAll();
      setAlerts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const acknowledgeAlert = useCallback(async (alertId: string) => {
    await alertsApi.acknowledge(alertId);
    fetchAlerts();
  }, [fetchAlerts]);

  return { alerts, loading, refetch: fetchAlerts, acknowledgeAlert };
}

export function useTimeline(patientId: string | null) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientId) {
      setEvents([]);
      setLoading(false);
      return;
    }

    timelineApi.getByPatient(patientId)
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [patientId]);

  return { events, loading };
}
