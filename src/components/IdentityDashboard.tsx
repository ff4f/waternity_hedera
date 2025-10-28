'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Award, 
  Droplets, 
  User, 
  CheckCircle, 
  Plus,
  Eye
} from 'lucide-react';

export default function IdentityDashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Mock credentials data
  const mockCredentials = [
    {
      id: 'wq-001',
      type: 'WaterQualityCredential',
      wellId: 1,
      ph: 7.2,
      tds: 150,
      turbidity: 2.1,
      location: 'Jakarta Selatan',
      certifiedBy: 'Lab Kualitas Air Jakarta',
      issuedAt: '2024-01-15',
      status: 'active'
    },
    {
      id: 'cons-001', 
      type: 'ConservationCredential',
      participantId: 'user-123',
      waterSaved: 500,
      conservationMethod: 'Rainwater Harvesting',
      period: 'Q1 2024',
      verifiedBy: 'Green Water Initiative',
      issuedAt: '2024-01-20',
      status: 'active'
    }
  ];

  // Form states
  const [waterQualityForm, setWaterQualityForm] = useState({
    wellId: '',
    ph: '',
    tds: '',
    turbidity: '',
    location: '',
    certifiedBy: ''
  });

  const [conservationForm, setConservationForm] = useState({
    participantId: '',
    waterSaved: '',
    conservationMethod: '',
    period: '',
    verifiedBy: ''
  });

  const [operatorForm, setOperatorForm] = useState({
    operatorId: '',
    wellId: '',
    certificationLevel: '',
    skills: '',
    validityMonths: '12'
  });

  const handleIssueWaterQualityCredential = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage('Water Quality Credential issued successfully!');
      setWaterQualityForm({
        wellId: '',
        ph: '',
        tds: '',
        turbidity: '',
        location: '',
        certifiedBy: ''
      });
    } catch (error) {
      setMessage('Failed to issue credential');
    } finally {
      setIsLoading(false);
    }
  };

  const handleIssueConservationCredential = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage('Conservation Credential issued successfully!');
      setConservationForm({
        participantId: '',
        waterSaved: '',
        conservationMethod: '',
        period: '',
        verifiedBy: ''
      });
    } catch (error) {
      setMessage('Failed to issue credential');
    } finally {
      setIsLoading(false);
    }
  };

  const handleIssueOperatorCredential = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage('Well Operator Credential issued successfully!');
      setOperatorForm({
        operatorId: '',
        wellId: '',
        certificationLevel: '',
        skills: '',
        validityMonths: '12'
      });
    } catch (error) {
      setMessage('Failed to issue credential');
    } finally {
      setIsLoading(false);
    }
  };

  const getCredentialIcon = (type: string) => {
    switch (type) {
      case 'WaterQualityCredential':
        return <Droplets className="h-5 w-5 text-blue-500" />;
      case 'ConservationCredential':
        return <Award className="h-5 w-5 text-green-500" />;
      case 'WellOperatorCredential':
        return <User className="h-5 w-5 text-purple-500" />;
      default:
        return <Shield className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">THG Identity Dashboard</h1>
          <p className="text-muted-foreground">Manage digital credentials and verifiable claims on Hedera</p>
        </div>
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-green-500" />
          <span className="text-sm font-medium">Hedera Consensus Service</span>
        </div>
      </div>

      {message && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {/* Overview Section */}
      <section id="overview" className="scroll-mt-28 space-y-4">
        <h2 className="text-2xl font-semibold">Overview</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Credentials</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockCredentials.length}</div>
              <p className="text-xs text-muted-foreground">Active credentials</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Water Quality</CardTitle>
              <Droplets className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mockCredentials.filter(c => c.type === 'WaterQualityCredential').length}
              </div>
              <p className="text-xs text-muted-foreground">Quality assessments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conservation</CardTitle>
              <Award className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mockCredentials.filter(c => c.type === 'ConservationCredential').length}
              </div>
              <p className="text-xs text-muted-foreground">Conservation efforts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Operators</CardTitle>
              <User className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Certified operators</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Credentials */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Credentials</CardTitle>
            <CardDescription>Latest issued digital credentials</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockCredentials.map((credential) => (
                <div key={credential.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      {credential.type === 'WaterQualityCredential' ? (
                        <Droplets className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Award className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{credential.type.replace('Credential', '')}</p>
                      <p className="text-sm text-muted-foreground">ID: {credential.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />Active
                    </Badge>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Water Quality Section */}
      <section id="water-quality" className="scroll-mt-28 space-y-4">
        <h2 className="text-2xl font-semibold">Water Quality</h2>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Droplets className="h-5 w-5 text-blue-500" />
              <span>Issue Water Quality Credential</span>
            </CardTitle>
            <CardDescription>Create a verifiable water quality assessment certificate</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="wellId">Well ID</Label>
                <Input
                  id="wellId"
                  type="number"
                  value={waterQualityForm.wellId}
                  onChange={(e) => setWaterQualityForm({...waterQualityForm, wellId: e.target.value})}
                  placeholder="Enter well ID"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={waterQualityForm.location}
                  onChange={(e) => setWaterQualityForm({...waterQualityForm, location: e.target.value})}
                  placeholder="Well location"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ph">pH Level</Label>
                <Input
                  id="ph"
                  type="number"
                  step="0.1"
                  value={waterQualityForm.ph}
                  onChange={(e) => setWaterQualityForm({...waterQualityForm, ph: e.target.value})}
                  placeholder="7.0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tds">TDS (ppm)</Label>
                <Input
                  id="tds"
                  type="number"
                  value={waterQualityForm.tds}
                  onChange={(e) => setWaterQualityForm({...waterQualityForm, tds: e.target.value})}
                  placeholder="150"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="turbidity">Turbidity (NTU)</Label>
                <Input
                  id="turbidity"
                  type="number"
                  step="0.1"
                  value={waterQualityForm.turbidity}
                  onChange={(e) => setWaterQualityForm({...waterQualityForm, turbidity: e.target.value})}
                  placeholder="2.0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="certifiedBy">Certified By</Label>
              <Input
                id="certifiedBy"
                value={waterQualityForm.certifiedBy}
                onChange={(e) => setWaterQualityForm({...waterQualityForm, certifiedBy: e.target.value})}
                placeholder="Certification authority"
              />
            </div>

            <Button 
              onClick={() => {/* handleIssueWaterQualityCredential */}} 
              disabled={isLoading}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              {isLoading ? 'Issuing...' : 'Issue Water Quality Credential'}
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Conservation Section */}
      <section id="conservation" className="scroll-mt-28 space-y-4">
        <h2 className="text-2xl font-semibold">Conservation</h2>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-green-500" />
              <span>Issue Conservation Credential</span>
            </CardTitle>
            <CardDescription>Recognize water conservation achievements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="participantId">Participant ID</Label>
                <Input
                  id="participantId"
                  value={conservationForm.participantId}
                  onChange={(e) => setConservationForm({...conservationForm, participantId: e.target.value})}
                  placeholder="Participant identifier"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="waterSaved">Water Saved (Liters)</Label>
                <Input
                  id="waterSaved"
                  type="number"
                  value={conservationForm.waterSaved}
                  onChange={(e) => setConservationForm({...conservationForm, waterSaved: e.target.value})}
                  placeholder="500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="conservationMethod">Conservation Method</Label>
                <Input
                  id="conservationMethod"
                  value={conservationForm.conservationMethod}
                  onChange={(e) => setConservationForm({...conservationForm, conservationMethod: e.target.value})}
                  placeholder="Rainwater harvesting, etc."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="period">Period</Label>
                <Input
                  id="period"
                  value={conservationForm.period}
                  onChange={(e) => setConservationForm({...conservationForm, period: e.target.value})}
                  placeholder="Q1 2024"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="verifiedBy">Verified By</Label>
              <Input
                id="verifiedBy"
                value={conservationForm.verifiedBy}
                onChange={(e) => setConservationForm({...conservationForm, verifiedBy: e.target.value})}
                placeholder="Verification authority"
              />
            </div>

            <Button 
              onClick={() => {/* handleIssueConservationCredential */}} 
              disabled={isLoading}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              {isLoading ? 'Issuing...' : 'Issue Conservation Credential'}
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Operators Section */}
      <section id="operators" className="scroll-mt-28 space-y-4">
        <h2 className="text-2xl font-semibold">Operators</h2>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5 text-purple-500" />
              <span>Issue Well Operator Credential</span>
            </CardTitle>
            <CardDescription>Certify well operators and their skills</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="operatorId">Operator ID</Label>
                <Input
                  id="operatorId"
                  value={operatorForm.operatorId}
                  onChange={(e) => setOperatorForm({...operatorForm, operatorId: e.target.value})}
                  placeholder="Operator identifier"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="opWellId">Well ID</Label>
                <Input
                  id="opWellId"
                  type="number"
                  value={operatorForm.wellId}
                  onChange={(e) => setOperatorForm({...operatorForm, wellId: e.target.value})}
                  placeholder="Well ID"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="certificationLevel">Certification Level</Label>
                <Input
                  id="certificationLevel"
                  value={operatorForm.certificationLevel}
                  onChange={(e) => setOperatorForm({...operatorForm, certificationLevel: e.target.value})}
                  placeholder="Basic, Advanced, Expert"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="validityMonths">Validity (Months)</Label>
                <Input
                  id="validityMonths"
                  type="number"
                  value={operatorForm.validityMonths}
                  onChange={(e) => setOperatorForm({...operatorForm, validityMonths: e.target.value})}
                  placeholder="12"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="skills">Skills</Label>
              <Input
                id="skills"
                value={operatorForm.skills}
                onChange={(e) => setOperatorForm({...operatorForm, skills: e.target.value})}
                placeholder="Maintenance, Quality Testing, etc."
              />
            </div>

            <Button 
              onClick={() => {/* handleIssueOperatorCredential */}} 
              disabled={isLoading}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              {isLoading ? 'Issuing...' : 'Issue Operator Credential'}
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Verify Section */}
      <section id="verify" className="scroll-mt-28 space-y-4">
        <h2 className="text-2xl font-semibold">Verify</h2>
        <Card>
          <CardHeader>
            <CardTitle>Verify Credential</CardTitle>
            <CardDescription>Verify the authenticity of a digital credential</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="credentialData">Credential Data (JSON)</Label>
              <textarea
                id="credentialData"
                className="w-full h-32 p-3 border rounded-md resize-none"
                placeholder="Paste credential JSON data here..."
              />
            </div>
            <Button className="w-full">
              <CheckCircle className="h-4 w-4 mr-2" />
              Verify Credential
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}