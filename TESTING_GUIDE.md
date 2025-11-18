# Testing Guide

## Quick Test Checklist

### Before Deploying Firestore Rules
Without the rules deployed, Firebase operations will fail (expected behavior):

1. **Open the website** in your browser
2. **Open Developer Console** (F12)
3. **Try adding a message:**
   - Click "➕ Nova Mensagem"
   - ✅ Modal should open with a form
   - Fill in a message
   - Click "💕 Adicionar"
   - ⚠️ Should see permission error in console
   - ✅ Modal should close anyway
   - ✅ Toast notification should appear

4. **Try adding a timeline event:**
   - Click "➕ Adicionar Momento"
   - ✅ Modal should open with a form
   - Fill in date, title, description, icon
   - Click "✨ Adicionar"
   - ⚠️ Should see permission error in console
   - ✅ Modal should close anyway
   - ✅ Toast notification should appear

5. **Test modal closing:**
   - Open message modal
   - ✅ Click X button - should close
   - Open message modal again
   - ✅ Click "Cancelar" - should close
   - Open message modal again
   - ✅ Click outside the modal - should close
   - Repeat for timeline modal

6. **Check favicon:**
   - ✅ Browser tab should show a heart icon
   - ✅ No 404 error for favicon in console

### After Deploying Firestore Rules

**IMPORTANT:** Deploy the rules first:
```bash
firebase deploy --only firestore:rules
```

Or manually copy `firestore.rules` to Firebase Console.

Then test again:

1. **Refresh the page**
2. **Wait for Firebase authentication** (should happen automatically)
3. **Try adding a message:**
   - Click "➕ Nova Mensagem"
   - ✅ Modal opens
   - Type: "Teste de mensagem 💕"
   - Click "💕 Adicionar"
   - ✅ Success toast appears: "Mensagem adicionada com sucesso! 💌"
   - ✅ Modal closes
   - ✅ Form is reset
   - ✅ No errors in console
   - ✅ New message appears in the envelope grid

4. **Try adding a timeline event:**
   - Click "➕ Adicionar Momento"
   - ✅ Modal opens
   - Fill in:
     - Date: Today's date
     - Title: "Teste"
     - Description: "Evento de teste"
     - Icon: "🎉"
   - Click "✨ Adicionar"
   - ✅ Success toast appears: "Evento adicionado à timeline! ✨"
   - ✅ Modal closes
   - ✅ Form is reset
   - ✅ No errors in console
   - ✅ New event appears in timeline

5. **Check Firebase Console:**
   - Go to Firestore Database
   - ✅ Should see `messages` collection with your test message
   - ✅ Should see `timeline` collection with your test event

### Testing on Different Devices

**Desktop:**
- ✅ Modals should be centered and properly sized
- ✅ Forms should be easy to fill
- ✅ Click outside to close should work

**Mobile:**
- ✅ Modals should adapt to screen size
- ✅ Forms should be touch-friendly
- ✅ Date picker should work properly
- ✅ Virtual keyboard should not cover form fields

**Tablet:**
- ✅ All desktop features should work
- ✅ Touch interactions should be smooth

## Expected Console Messages

### Successful Operation
```
Firebase: autenticado anonimamente como [uid]
```

### With Firestore Rules Deployed
No errors! Just successful operations.

### Without Firestore Rules (Before Deployment)
```
FirebaseError: Missing or insufficient permissions
Error adding message: [error details]
```

## Common Issues

### Issue: "Missing or insufficient permissions"
**Solution:** Deploy the Firestore rules:
```bash
firebase deploy --only firestore:rules
```

### Issue: Modal doesn't open
**Check:**
1. Browser console for JavaScript errors
2. That the buttons have correct IDs
3. That JavaScript is enabled

### Issue: Modal doesn't close
**Check:**
1. Click the X button
2. Click Cancel button  
3. Click outside the modal (in the dark area)
4. Browser console for errors

### Issue: Form doesn't submit
**Check:**
1. All required fields are filled
2. Date format is correct (YYYY-MM-DD)
3. Browser console for validation errors

### Issue: No toast notifications
**Check:**
1. Browser console for errors
2. That the `showToast` function exists
3. Toast CSS is properly loaded

## Browser Compatibility

Tested and should work on:
- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- Modals are lightweight and use CSS animations
- Firebase operations are asynchronous
- No impact on page load time
- Smooth animations on all devices

## Accessibility

- Modals have proper ARIA labels
- Forms have associated labels
- Keyboard navigation works
- Focus management implemented
- Close button is accessible via keyboard

## Next Steps

After successful testing:
1. ✅ Merge this PR
2. ✅ Deploy to production (GitHub Pages)
3. ✅ Verify Firebase rules are applied
4. ✅ Test on production URL
5. ✅ Celebrate! 🎉
