import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast({ title: 'كلمة المرور قصيرة جداً', variant: 'destructive' });
    if (password !== confirm) return toast({ title: 'كلمتا المرور غير متطابقتين', variant: 'destructive' });
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    toast({ title: 'تم تحديث كلمة المرور ✅' });
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-background" dir="rtl">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>تعيين كلمة مرور جديدة</CardTitle>
          <CardDescription>أدخل كلمة المرور الجديدة لحسابك</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>كلمة المرور الجديدة</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type="password" className="pr-10" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>تأكيد كلمة المرور</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type="password" className="pr-10" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
              </div>
            </div>
            <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (<>حفظ<ArrowRight className="w-4 h-4" /></>)}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
