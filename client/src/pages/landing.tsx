import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Landing() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-bg">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Star className="mx-auto h-16 w-16 text-white mb-4" />
          <h2 className="text-3xl font-bold text-white">Jyotish Charts Manager</h2>
          <p className="mt-2 text-white/80">Professional astrological chart management</p>
        </div>
        
        <Card className="p-8 shadow-2xl">
          <CardContent className="space-y-6 p-0">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-foreground mb-2">Welcome</h3>
              <p className="text-muted-foreground">Sign in to access your astrological charts</p>
            </div>
            
            <Button 
              className="w-full" 
              size="lg"
              onClick={() => window.location.href = '/api/login'}
              data-testid="button-login"
            >
              Sign In with Replit
            </Button>
            
            <div className="text-center text-sm text-muted-foreground">
              <p>Secure authentication powered by Replit</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
