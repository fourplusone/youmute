/*

The MIT License

Copyright (c) 2010 Matthias Bartelmeﬂ

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/


#import "YouMuteView.h"

@interface YouMuteView (Internal)
- (id)_initWithArguments:(NSDictionary *)arguments;
@end

@implementation YouMuteView

// WebPlugInViewFactory protocol
// The principal class of the plug-in bundle must implement this protocol.

+ (NSView *)plugInViewWithArguments:(NSDictionary *)newArguments
{
    
    return [[[self alloc] _initWithArguments:newArguments] autorelease];
    
}

// WebPlugIn informal protocol

- (void)webPlugInInitialize
{
    // This method will be only called once per instance of the plug-in object, and will be called
    // before any other methods in the WebPlugIn protocol.
    // You are not required to implement this method.  It may safely be removed.
}

- (void)webPlugInStart
{
    // The plug-in usually begins drawing, playing sounds and/or animation in this method.
    // You are not required to implement this method.  It may safely be removed.
}

- (void)webPlugInStop
{
    // The plug-in normally stop animations/sounds in this method.
    // You are not required to implement this method.  It may safely be removed.
}

- (void)webPlugInDestroy
{
    // Perform cleanup and prepare to be deallocated.
    NSLog(@"will be deallocated... au revoir");

    [itns release];
}

- (void)webPlugInSetIsSelected:(BOOL)isSelected
{
    // This is typically used to allow the plug-in to alter its appearance when selected.
    // You are not required to implement this method.  It may safely be removed.
}

- (id)objectForWebScript
{
    // Returns the object that exposes the plug-in's interface.  The class of this object can implement
    // methods from the WebScripting informal protocol.
    // You are not required to implement this method.  It may safely be removed.
    return self;
}

-(void)pause
{
    NSLog(@"pause...");
    if([itns isRunning] && itns.playerState ==  iTunesEPlSPlaying){
        [itns pause];
        wasPausedByMe = YES;
    }
}
-(void)resume
{
    NSLog(@"resume");
    if([itns isRunning] && itns.playerState !=  iTunesEPlSPlaying && wasPausedByMe){
        [itns playpause];
        wasPausedByMe = NO;
    }
}

+ (BOOL)isSelectorExcludedFromWebScript:(SEL)selector
{
    if (selector == @selector(pause) || selector == @selector(resume)) {
        return NO;
    }
    return YES;
}

@end

@implementation YouMuteView (Internal)

- (id)_initWithArguments:(NSDictionary *)newArguments
{
    if (!(self = [super initWithFrame:NSZeroRect]))
        return nil;
    
    id pluginContainer = [newArguments objectForKey:WebPlugInContainerKey];
    
    NSString * url = [[[pluginContainer webFrame] webView] mainFrameURL];
    if(![[url substringToIndex:[YM_VALID_URL_PREFIX length] ] isEqualToString:YM_VALID_URL_PREFIX])
    {
        NSLog(@"YouMute: called from invalid URL(%@), won't do anything", url);
        return nil;
    }
    itns = [[SBApplication applicationWithBundleIdentifier:@"com.apple.iTunes"] retain];
    return self;
}


@end
