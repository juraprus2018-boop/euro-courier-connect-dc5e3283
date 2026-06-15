import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Header } from '@/components/public/Header';
import { Footer } from '@/components/public/Footer';
import { SEOHead } from '@/components/SEOHead';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogIn, UserPlus } from 'lucide-react';

const AccountLogin = () => {
  const navigate = useNavigate();
  const { user, signIn, signUp, loading } = useAuth();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupNaam, setSignupNaam] = useState('');

  useEffect(() => {
    if (user && !loading) navigate('/account');
  }, [user, loading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setBusy(false);
    if (error) {
      toast({ title: 'Inloggen mislukt', description: error.message, variant: 'destructive' });
    } else {
      navigate('/account');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signupPassword.length < 8) {
      toast({ title: 'Wachtwoord te kort', description: 'Minimaal 8 tekens.', variant: 'destructive' });
      return;
    }
    setBusy(true);
    const { error } = await signUp(signupEmail, signupPassword);
    setBusy(false);
    if (error) {
      toast({ title: 'Registreren mislukt', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Account aangemaakt', description: 'U bent automatisch ingelogd.' });
      navigate('/account');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead title="Mijn account inloggen" noindex />
      <Header />
      <main className="flex-1 py-12">
        <div className="container max-w-md">
          <h1 className="font-display text-3xl font-bold mb-2 text-center">Mijn Account</h1>
          <p className="text-muted-foreground text-center mb-8">
            Bekijk uw aanvragen, beheer adressen en stuur nieuwe offertes in.
          </p>

          <Card>
            <CardContent className="p-6">
              <Tabs defaultValue="login">
                <TabsList className="grid grid-cols-2 mb-6">
                  <TabsTrigger value="login"><LogIn className="mr-2 h-4 w-4" />Inloggen</TabsTrigger>
                  <TabsTrigger value="signup"><UserPlus className="mr-2 h-4 w-4" />Registreren</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <Label htmlFor="login-email">E-mailadres</Label>
                      <Input id="login-email" type="email" required autoComplete="email"
                        value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="login-password">Wachtwoord</Label>
                      <Input id="login-password" type="password" required autoComplete="current-password"
                        value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
                    </div>
                    <Button type="submit" className="w-full" disabled={busy}>
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Inloggen'}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div>
                      <Label htmlFor="signup-naam">Uw naam</Label>
                      <Input id="signup-naam" required value={signupNaam}
                        onChange={(e) => setSignupNaam(e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="signup-email">E-mailadres</Label>
                      <Input id="signup-email" type="email" required autoComplete="email"
                        value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} />
                      <p className="text-xs text-muted-foreground mt-1">
                        Gebruik het e-mailadres waarmee u eerder offertes hebt aangevraagd om uw historie te zien.
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="signup-password">Wachtwoord (min 8 tekens)</Label>
                      <Input id="signup-password" type="password" required minLength={8}
                        autoComplete="new-password"
                        value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} />
                    </div>
                    <Button type="submit" className="w-full" disabled={busy}>
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Account aanmaken'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-6">
            <Link to="/" className="hover:underline">← Terug naar de website</Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AccountLogin;
