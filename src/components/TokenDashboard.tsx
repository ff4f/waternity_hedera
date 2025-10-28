'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Coins, 
  Award, 
  Send, 
  Plus, 
  Wallet,
  TrendingUp,
  Users,
  Copy,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { 
  useHTS, 
  useWaterToken, 
  useRewardToken, 
  useTokenBalances 
} from '@/lib/hooks/useHTS';
import { TokenInfo, TokenBalance } from '@/lib/tokens/hts-service';

export default function TokenDashboard() {
  const hts = useHTS();
  const waterToken = useWaterToken();
  const rewardToken = useRewardToken();
  const tokenBalances = useTokenBalances(process.env.NEXT_PUBLIC_HEDERA_ACCOUNT_ID);

  const [activeTab, setActiveTab] = useState('overview');
  const [selectedToken, setSelectedToken] = useState<TokenInfo | null>(null);

  // Form states
  const [transferForm, setTransferForm] = useState({
    tokenId: '',
    to: '',
    amount: '',
    memo: ''
  });

  const [rewardForm, setRewardForm] = useState({
    tokenId: '',
    recipients: [{ accountId: '', amount: '', reason: '' }]
  });

  const [associateForm, setAssociateForm] = useState({
    accountId: '',
    tokenId: ''
  });

  const handleCreateWaterToken = async () => {
    const token = await waterToken.createWaterToken();
    if (token) {
      console.log('Water token created:', token);
    }
  };

  const handleCreateRewardToken = async () => {
    const token = await rewardToken.createRewardToken();
    if (token) {
      console.log('Reward token created:', token);
    }
  };

  const handleTransferToken = async () => {
    if (!transferForm.tokenId || !transferForm.to || !transferForm.amount) {
      hts.error = 'Please fill in all required fields';
      return;
    }

    await hts.transferToken({
      tokenId: transferForm.tokenId,
      from: process.env.NEXT_PUBLIC_HEDERA_ACCOUNT_ID || '',
      to: transferForm.to,
      amount: transferForm.amount,
      memo: transferForm.memo
    });

    if (!hts.error) {
      setTransferForm({ tokenId: '', to: '', amount: '', memo: '' });
    }
  };

  const handleDistributeRewards = async () => {
    if (!rewardForm.tokenId || rewardForm.recipients.length === 0) {
      return;
    }

    const validRecipients = rewardForm.recipients.filter(r => 
      r.accountId && r.amount && r.reason
    );

    if (validRecipients.length === 0) {
      return;
    }

    await rewardToken.distributeRewards(
      rewardForm.tokenId,
      validRecipients.map(r => ({
        accountId: r.accountId,
        amount: parseFloat(r.amount),
        reason: r.reason
      }))
    );

    if (!rewardToken.error) {
      setRewardForm({
        tokenId: '',
        recipients: [{ accountId: '', amount: '', reason: '' }]
      });
    }
  };

  const handleAssociateToken = async () => {
    if (!associateForm.accountId || !associateForm.tokenId) {
      return;
    }

    await hts.associateToken(associateForm.accountId, associateForm.tokenId);

    if (!hts.error) {
      setAssociateForm({ accountId: '', tokenId: '' });
    }
  };

  const addRecipient = () => {
    setRewardForm(prev => ({
      ...prev,
      recipients: [...prev.recipients, { accountId: '', amount: '', reason: '' }]
    }));
  };

  const removeRecipient = (index: number) => {
    setRewardForm(prev => ({
      ...prev,
      recipients: prev.recipients.filter((_, i) => i !== index)
    }));
  };

  const updateRecipient = (index: number, field: string, value: string) => {
    setRewardForm(prev => ({
      ...prev,
      recipients: prev.recipients.map((r, i) => 
        i === index ? { ...r, [field]: value } : r
      )
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatTokenAmount = (amount: string, decimals: number) => {
    const value = parseFloat(amount) / Math.pow(10, decimals);
    return value.toLocaleString();
  };

  const getTokenTypeColor = (symbol: string) => {
    switch (symbol) {
      case 'WATER':
        return 'bg-blue-100 text-blue-800';
      case 'REWARD':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Token Dashboard</h1>
          <p className="text-muted-foreground">
            Manage HTS tokens for the Waternity ecosystem
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Coins className="h-8 w-8 text-primary" />
          <span className="text-sm font-medium">Hedera Token Service</span>
        </div>
      </div>

      {(hts.error || waterToken.error || rewardToken.error) && (
        <Alert variant="destructive">
          <AlertDescription>
            {hts.error || waterToken.error || rewardToken.error}
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="create">Create Tokens</TabsTrigger>
          <TabsTrigger value="transfer">Transfer</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="manage">Manage</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
                <Coins className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{hts.tokens.length}</div>
                <p className="text-xs text-muted-foreground">
                  HTS tokens created
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Water Tokens</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{waterToken.waterTokens.length}</div>
                <p className="text-xs text-muted-foreground">
                  Payment tokens
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Reward Tokens</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{rewardToken.rewardTokens.length}</div>
                <p className="text-xs text-muted-foreground">
                  Conservation rewards
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Created Tokens</CardTitle>
                  <CardDescription>
                    Tokens created in the Waternity ecosystem
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => tokenBalances.refreshBalances()}
                  disabled={tokenBalances.loading}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {hts.tokens.map((token) => (
                    <div key={token.tokenId} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {token.symbol === 'WATER' ? (
                            <Wallet className="h-8 w-8 text-blue-500" />
                          ) : token.symbol === 'REWARD' ? (
                            <Award className="h-8 w-8 text-green-500" />
                          ) : (
                            <Coins className="h-8 w-8 text-gray-500" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="font-medium">{token.name}</p>
                            <Badge className={getTokenTypeColor(token.symbol)}>
                              {token.symbol}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Supply: {formatTokenAmount(token.totalSupply, token.decimals)}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-muted-foreground">{token.tokenId}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(token.tokenId)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedToken(token)}
                        >
                          View Details
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`https://hashscan.io/testnet/token/${token.tokenId}`, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Balances</CardTitle>
                <CardDescription>
                  Token balances for the operator account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tokenBalances.balances.map((balance) => (
                    <div key={balance.tokenId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{balance.tokenId}</p>
                        <p className="text-sm text-muted-foreground">
                          Balance: {formatTokenAmount(balance.balance, balance.decimals)}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {balance.decimals} decimals
                      </Badge>
                    </div>
                  ))}
                  {tokenBalances.balances.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">
                      No token balances found
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Create Water Token</CardTitle>
                <CardDescription>
                  Create WATER tokens for ecosystem payments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Token Details</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Name: Waternity Token</li>
                    <li>• Symbol: WATER</li>
                    <li>• Decimals: 8</li>
                    <li>• Initial Supply: 1,000,000 WATER</li>
                    <li>• Max Supply: 10,000,000 WATER</li>
                    <li>• Type: Fungible, Finite Supply</li>
                  </ul>
                </div>
                <Button 
                  onClick={handleCreateWaterToken}
                  disabled={waterToken.loading}
                  className="w-full"
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  Create Water Token
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Create Reward Token</CardTitle>
                <CardDescription>
                  Create REWARD tokens for conservation incentives
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Token Details</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Name: Waternity Rewards</li>
                    <li>• Symbol: REWARD</li>
                    <li>• Decimals: 8</li>
                    <li>• Initial Supply: 500,000 REWARD</li>
                    <li>• Max Supply: Infinite</li>
                    <li>• Type: Fungible, Infinite Supply</li>
                  </ul>
                </div>
                <Button 
                  onClick={handleCreateRewardToken}
                  disabled={rewardToken.loading}
                  className="w-full"
                >
                  <Award className="h-4 w-4 mr-2" />
                  Create Reward Token
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transfer" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Transfer Tokens</CardTitle>
              <CardDescription>
                Send tokens to other accounts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="transferTokenId">Token ID</Label>
                  <Input
                    id="transferTokenId"
                    value={transferForm.tokenId}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTransferForm(prev => ({ ...prev, tokenId: e.target.value }))}
                    placeholder="0.0.123456"
                  />
                </div>
                <div>
                  <Label htmlFor="transferTo">Recipient Account</Label>
                  <Input
                    id="transferTo"
                    value={transferForm.to}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTransferForm(prev => ({ ...prev, to: e.target.value }))}
                    placeholder="0.0.654321"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="transferAmount">Amount</Label>
                <Input
                  id="transferAmount"
                  type="number"
                  value={transferForm.amount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTransferForm(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="100"
                />
              </div>

              <div>
                <Label htmlFor="transferMemo">Memo (Optional)</Label>
                <Textarea
                  id="transferMemo"
                  value={transferForm.memo}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTransferForm(prev => ({ ...prev, memo: e.target.value }))}
                  placeholder="Transfer description"
                />
              </div>

              <Button 
                onClick={handleTransferToken}
                disabled={hts.loading}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                Transfer Tokens
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Distribute Rewards</CardTitle>
              <CardDescription>
                Send reward tokens to multiple recipients
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="rewardTokenId">Reward Token ID</Label>
                <Input
                  id="rewardTokenId"
                  value={rewardForm.tokenId}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRewardForm(prev => ({ ...prev, tokenId: e.target.value }))}
                  placeholder="0.0.123456"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Recipients</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addRecipient}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Recipient
                  </Button>
                </div>

                {rewardForm.recipients.map((recipient, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Recipient {index + 1}</span>
                      {rewardForm.recipients.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRecipient(index)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <Label>Account ID</Label>
                        <Input
                          value={recipient.accountId}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateRecipient(index, 'accountId', e.target.value)}
                          placeholder="0.0.654321"
                        />
                      </div>
                      <div>
                        <Label>Amount</Label>
                        <Input
                          type="number"
                          value={recipient.amount}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateRecipient(index, 'amount', e.target.value)}
                          placeholder="100"
                        />
                      </div>
                      <div>
                        <Label>Reason</Label>
                        <Input
                          value={recipient.reason}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateRecipient(index, 'reason', e.target.value)}
                          placeholder="Water conservation"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button 
                onClick={handleDistributeRewards}
                disabled={rewardToken.loading}
                className="w-full"
              >
                <Award className="h-4 w-4 mr-2" />
                Distribute Rewards
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Associate Token</CardTitle>
              <CardDescription>
                Associate a token with an account to enable transfers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="associateAccountId">Account ID</Label>
                  <Input
                    id="associateAccountId"
                    value={associateForm.accountId}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAssociateForm(prev => ({ ...prev, accountId: e.target.value }))}
                    placeholder="0.0.654321"
                  />
                </div>
                <div>
                  <Label htmlFor="associateTokenId">Token ID</Label>
                  <Input
                    id="associateTokenId"
                    value={associateForm.tokenId}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAssociateForm(prev => ({ ...prev, tokenId: e.target.value }))}
                    placeholder="0.0.123456"
                  />
                </div>
              </div>

              <Button 
                onClick={handleAssociateToken}
                disabled={hts.loading}
                className="w-full"
              >
                <Users className="h-4 w-4 mr-2" />
                Associate Token
              </Button>
            </CardContent>
          </Card>

          {selectedToken && (
            <Card>
              <CardHeader>
                <CardTitle>Token Details</CardTitle>
                <CardDescription>
                  Detailed information about {selectedToken.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Token ID:</p>
                    <p className="text-muted-foreground">{selectedToken.tokenId}</p>
                  </div>
                  <div>
                    <p className="font-medium">Symbol:</p>
                    <p className="text-muted-foreground">{selectedToken.symbol}</p>
                  </div>
                  <div>
                    <p className="font-medium">Decimals:</p>
                    <p className="text-muted-foreground">{selectedToken.decimals}</p>
                  </div>
                  <div>
                    <p className="font-medium">Total Supply:</p>
                    <p className="text-muted-foreground">
                      {formatTokenAmount(selectedToken.totalSupply, selectedToken.decimals)}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Treasury:</p>
                    <p className="text-muted-foreground">{selectedToken.treasuryAccountId}</p>
                  </div>
                  <div>
                    <p className="font-medium">Supply Type:</p>
                    <p className="text-muted-foreground">{selectedToken.supplyType}</p>
                  </div>
                  {selectedToken.maxSupply && (
                    <div>
                      <p className="font-medium">Max Supply:</p>
                      <p className="text-muted-foreground">
                        {formatTokenAmount(selectedToken.maxSupply, selectedToken.decimals)}
                      </p>
                    </div>
                  )}
                  {selectedToken.metadata && (
                    <div className="col-span-2">
                      <p className="font-medium mb-2">Metadata:</p>
                      <pre className="text-xs bg-muted p-3 rounded overflow-auto">
                        {selectedToken.metadata}
                      </pre>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}