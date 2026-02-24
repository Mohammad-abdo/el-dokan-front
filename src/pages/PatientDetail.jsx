import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  ArrowLeft,
  Edit,
  Trash2,
  Heart,
  AlertTriangle,
  Calendar,
  Pill,
  FileText,
} from "lucide-react";

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchPatientDetail();
      fetchPatientProfile();
    }
  }, [id]);

  const fetchPatientDetail = async () => {
    try {
      const response = await api.get(`/patients/${id}`);
      setPatient(response.data.patient);
    } catch (error) {
      console.error("Error fetching patient:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientProfile = async () => {
    try {
      const [
        familyHistory,
        currentDiseases,
        surgeries,
        allergies,
        lifestyle,
        medicines,
      ] = await Promise.all([
        api
          .get(`/patient-profile/family-history`)
          .catch(() => ({ data: { familyHistory: [] } })),
        api
          .get(`/patient-profile/current-diseases`)
          .catch(() => ({ data: { currentDiseases: [] } })),
        api
          .get(`/patient-profile/surgeries`)
          .catch(() => ({ data: { surgeries: [] } })),
        api
          .get(`/patient-profile/allergies`)
          .catch(() => ({ data: { allergies: [] } })),
        api
          .get(`/patient-profile/lifestyle`)
          .catch(() => ({ data: { answers: [] } })),
        api
          .get(`/patient-profile/medicines`)
          .catch(() => ({ data: { medicines: [] } })),
      ]);
    } catch (error) {
      console.error("Error fetching patient profile:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Patient not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/dashboard/patients")}
          className="p-2 rounded-lg hover:bg-accent transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold mb-2">Patient Details</h1>
          <p className="text-muted-foreground">
            Complete patient profile information
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-semibold">
                {patient.user.firstName} {patient.user.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-semibold">{patient.user.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-semibold">{patient.user.phone || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date of Birth</p>
              <p className="font-semibold">
                {patient.user.dateOfBirth
                  ? new Date(patient.user.dateOfBirth).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Gender</p>
              <p className="font-semibold capitalize">
                {patient.user.gender || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sex at Birth</p>
              <p className="font-semibold capitalize">
                {patient.sexAtBirth || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Height</p>
              <p className="font-semibold">
                {patient.height ? `${patient.height} cm` : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Weight</p>
              <p className="font-semibold">
                {patient.weight ? `${patient.weight} kg` : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Blood Group</p>
              <p className="font-semibold">{patient.bloodGroup || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Patient ID</p>
              <p className="font-semibold">{patient.patientId}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5" />
            Family History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {patient.familyHistories && patient.familyHistories.length > 0 ? (
            <div className="space-y-2">
              {patient.familyHistories.map((fh) => (
                <div key={fh.id} className="p-3 rounded-lg border border">
                  <p className="font-semibold">{fh.disease.name}</p>
                  {fh.relation && (
                    <p className="text-sm text-muted-foreground">
                      Relation: {fh.relation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No family history recorded</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Current Diseases
          </CardTitle>
        </CardHeader>
        <CardContent>
          {patient.currentDiseases && patient.currentDiseases.length > 0 ? (
            <div className="space-y-2">
              {patient.currentDiseases.map((cd) => (
                <div key={cd.id} className="p-3 rounded-lg border border">
                  <p className="font-semibold">{cd.disease.name}</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    Status: {cd.status}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">
              No current diseases recorded
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Previous Surgeries
          </CardTitle>
        </CardHeader>
        <CardContent>
          {patient.surgeries && patient.surgeries.length > 0 ? (
            <div className="space-y-2">
              {patient.surgeries.map((surgery) => (
                <div key={surgery.id} className="p-3 rounded-lg border border">
                  <p className="font-semibold">{surgery.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Date: {new Date(surgery.date).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No surgeries recorded</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Allergies
          </CardTitle>
        </CardHeader>
        <CardContent>
          {patient.patientAllergies && patient.patientAllergies.length > 0 ? (
            <div className="space-y-2">
              {patient.patientAllergies.map((allergy) => (
                <div key={allergy.id} className="p-3 rounded-lg border border">
                  <p className="font-semibold">{allergy.allergy.name}</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    Severity: {allergy.severity}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No allergies recorded</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="w-5 h-5" />
            Current Medicines
          </CardTitle>
        </CardHeader>
        <CardContent>
          {patient.patientMedicines && patient.patientMedicines.length > 0 ? (
            <div className="space-y-2">
              {patient.patientMedicines.map((med) => (
                <div key={med.id} className="p-3 rounded-lg border border">
                  <p className="font-semibold">{med.medicine.name}</p>
                  {med.dosage && (
                    <p className="text-sm text-muted-foreground">
                      Dosage: {med.dosage}
                    </p>
                  )}
                  {med.frequency && (
                    <p className="text-sm text-muted-foreground">
                      Frequency: {med.frequency}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No medicines recorded</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
