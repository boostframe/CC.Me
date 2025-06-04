import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Video, Zap, Shield, Clock, Users, Star, Play, ArrowRight } from "lucide-react";
import boostFrameLogo from "@assets/BoostFrame Logo.png";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen relative" style={{backgroundColor: '#0A0E1A'}}>
      {/* Clean Geometric Background */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(4, 166, 242, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(4, 166, 242, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px'
        }}></div>
        
        {/* Clean accent shapes */}
        <div className="absolute top-20 right-20 w-32 h-32 rounded-full border border-blue-500/10"></div>
        <div className="absolute bottom-40 left-20 w-24 h-24 rounded-lg border border-blue-400/10 rotate-45"></div>
        <div className="absolute top-1/3 left-1/4 w-2 h-16 bg-blue-500/10 rounded-full"></div>
        <div className="absolute bottom-1/3 right-1/4 w-2 h-20 bg-blue-400/10 rounded-full"></div>
      </div>

      {/* Navigation */}
      <nav className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex items-center">
                <img src={boostFrameLogo} alt="CC.Me" className="w-8 h-8 mr-2" />
                <div>
                  <span className="text-xl font-bold text-white">CC</span>
                  <span className="text-xl font-bold" style={{color: '#04A6F2'}}>.Me</span>
                  <div className="text-xs text-gray-400 -mt-1">
                    by BoostFrame.io
                  </div>
                </div>
              </div>
            </div>
            
            <Button onClick={handleLogin} style={{backgroundColor: '#04A6F2'}} className="hover:opacity-90 text-white">
              Sign In
            </Button>
          </div>
        </div>
      </nav>
      {/* Hero Section */}
      <section className="relative py-16 px-4 sm:px-6 lg:px-8 flex items-center z-10">
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="mb-6">
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium mb-6 border" style={{backgroundColor: '#04A6F2', borderColor: '#04A6F2', color: 'white'}}>
              <Zap className="w-4 h-4 mr-2" />
              AI-Powered Video Captioning
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Caption Your Videos
            <span className="block text-transparent bg-clip-text" style={{backgroundImage: `linear-gradient(to right, #04A6F2, #1F1FCA)`}}>
              In Minutes, Not Hours
            </span>
          </h1>
          
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            Upload portrait videos and get professional, customizable captions instantly. 
            Perfect for TikTok, Instagram Reels, and YouTube Shorts.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button size="lg" onClick={handleLogin} style={{backgroundColor: '#04A6F2'}} className="hover:opacity-90 text-white px-8 py-4 text-lg">
              <Play className="w-5 h-5 mr-2" />
              Start Free - 5 Minutes
            </Button>
            <Button size="lg" variant="outline" style={{borderColor: '#04A6F2', color: '#04A6F2'}} className="hover:bg-white/10 px-8 py-4 text-lg">
              <Video className="w-5 h-5 mr-2" />
              Watch Demo
            </Button>
          </div>
          
          {/* Free tier highlight */}
          <div className="inline-flex items-center px-6 py-3 rounded-full text-sm font-medium bg-white/10 border border-white/20 text-white backdrop-blur-sm">
            <Star className="w-4 h-4 mr-2" style={{color: '#04A6F2'}} />
            5 minutes free • No watermark • No credit card required
          </div>
        </div>
      </section>
      {/* Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              Everything you need for professional video captions
            </h2>
            <p className="text-lg text-gray-300">
              Powered by advanced AI and optimized for portrait videos
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-slate-800/50 border-slate-600/50 backdrop-blur-sm hover:bg-slate-800/60 transition-all duration-300">
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4" style={{backgroundColor: '#04A6F2'}}>
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">Lightning Fast</h3>
                <p className="text-gray-300">
                  Get captions in under 5 minutes for most videos. No waiting around.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-600/50 backdrop-blur-sm hover:bg-slate-800/60 transition-all duration-300">
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4" style={{backgroundColor: '#1F1FCA'}}>
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">Highly Accurate</h3>
                <p className="text-gray-300">
                  AI-powered transcription with 95%+ accuracy for clear audio.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-600/50 backdrop-blur-sm hover:bg-slate-800/60 transition-all duration-300">
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4" style={{backgroundColor: '#04A6F2'}}>
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">Easy to Use</h3>
                <p className="text-gray-300">
                  Simple drag-and-drop interface. Customize style, color, and position.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      {/* Pricing Preview */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-3xl font-bold text-white mb-4">
            Start Free, Upgrade When Ready
          </h2>
          <p className="text-lg text-gray-300 mb-12">
            Try CC.Me with 5 free minutes, then upgrade for unlimited access
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="bg-slate-800/50 border-slate-600/50 backdrop-blur-sm hover:bg-slate-800/60 transition-all duration-300">
              <CardContent className="pt-6">
                <h3 className="text-2xl font-bold mb-2 text-white">Free</h3>
                <p className="text-4xl font-bold mb-4" style={{color: '#04A6F2'}}>$0</p>
                <ul className="text-left space-y-2 mb-6">
                  <li className="flex items-center text-gray-300">
                    <span className="w-2 h-2 rounded-full mr-3" style={{backgroundColor: '#04A6F2'}}></span>
                    5 minutes free captioning
                  </li>
                  <li className="flex items-center text-gray-300">
                    <span className="w-2 h-2 rounded-full mr-3" style={{backgroundColor: '#04A6F2'}}></span>
                    No watermark
                  </li>
                  <li className="flex items-center text-gray-300">
                    <span className="w-2 h-2 rounded-full mr-3" style={{backgroundColor: '#04A6F2'}}></span>
                    Portrait video support
                  </li>
                  <li className="flex items-center text-gray-300">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></span>
                    Additional 5 min with watermark
                  </li>
                </ul>
                <Button onClick={handleLogin} className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20">
                  Get Started Free
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-2 backdrop-blur-sm hover:bg-slate-800/60 transition-all duration-300 relative" style={{borderColor: '#04A6F2'}}>
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 text-white px-4 py-1 rounded-full text-sm font-medium" style={{backgroundColor: '#04A6F2'}}>
                Most Popular
              </div>
              <CardContent className="pt-6">
                <h3 className="text-2xl font-bold mb-2 text-white">Pro</h3>
                <p className="text-4xl font-bold mb-4" style={{color: '#04A6F2'}}>$9.99<span className="text-lg text-gray-400">/mo</span></p>
                <ul className="text-left space-y-2 mb-6">
                  <li className="flex items-center text-gray-300">
                    <span className="w-2 h-2 rounded-full mr-3" style={{backgroundColor: '#04A6F2'}}></span>
                    Unlimited captioning
                  </li>
                  <li className="flex items-center text-gray-300">
                    <span className="w-2 h-2 rounded-full mr-3" style={{backgroundColor: '#04A6F2'}}></span>
                    No watermarks
                  </li>
                  <li className="flex items-center text-gray-300">
                    <span className="w-2 h-2 rounded-full mr-3" style={{backgroundColor: '#04A6F2'}}></span>
                    Priority processing
                  </li>
                  <li className="flex items-center text-gray-300">
                    <span className="w-2 h-2 rounded-full mr-3" style={{backgroundColor: '#04A6F2'}}></span>
                    Advanced customization
                  </li>
                </ul>
                <Button onClick={handleLogin} style={{backgroundColor: '#04A6F2'}} className="w-full hover:opacity-90 text-white">
                  Start Free Trial
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to caption your first video?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of creators and businesses using CC.Me to create engaging content
          </p>
          <Button size="lg" onClick={handleLogin} style={{backgroundColor: '#04A6F2'}} className="hover:opacity-90 text-white px-8 py-4 text-lg">
            <ArrowRight className="w-5 h-5 mr-2" />
            Get Started Now
          </Button>
        </div>
      </section>
      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-6xl mx-auto text-center">
          {/* Logo and Tagline */}
          <div className="mb-8">
            <div className="flex items-center justify-center mb-4">
              <img src={boostFrameLogo} alt="CC.Me" className="w-8 h-8 mr-2" />
              <div>
                <span className="text-xl font-bold text-white">CC</span>
                <span className="text-xl font-bold" style={{color: '#04A6F2'}}>.Me</span>
              </div>
            </div>
            <div className="text-white text-lg mb-2">
              Close Caption Me
            </div>
            <div className="text-white text-lg">
              by BoostFrame.io
            </div>
          </div>
          
          {/* Copyright and Links */}
          <div className="border-t border-white/10 pt-8">
            <p className="text-gray-400 text-sm mb-4">
              © 2025 CC.Me by BoostFrame.io. All rights reserved.
            </p>
            <div className="flex justify-center space-x-8">
              <a href="https://boostframe.io/privacy-policy" className="text-gray-400 hover:text-white transition-colors text-sm">Privacy Policy</a>
              <a href="https://boostframe.io/terms-of-service" className="text-gray-400 hover:text-white transition-colors text-sm">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
