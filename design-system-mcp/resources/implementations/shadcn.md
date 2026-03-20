---
description: shadcn/ui implementation — copy-paste React/Next.js components with Tailwind and Radix primitives.
---

# shadcn/ui Implementation

shadcn/ui provides copy-paste components for React/Next.js with Tailwind CSS and Radix UI primitives.

## Setup

```bash
npx shadcn@latest init
npx shadcn@latest add button input card table badge dialog
```

Components are copied into `components/ui/` — you own the code.

## Available Components

### Button
```tsx
import { Button } from "@/components/ui/button"

<Button variant="default" size="default">Save</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
<Button variant="ghost">Menu</Button>
```

### Input
```tsx
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

<div className="space-y-2">
    <Label htmlFor="email">Email</Label>
    <Input id="email" type="email" placeholder="you@example.com" />
</div>
```

### Card
```tsx
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"

<Card>
    <CardHeader>
        <CardTitle>Campaign</CardTitle>
    </CardHeader>
    <CardContent>
        <p>Card content</p>
    </CardContent>
    <CardFooter>
        <Button size="sm">View</Button>
    </CardFooter>
</Card>
```

### Table
```tsx
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"

<Table>
    <TableHeader>
        <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
        </TableRow>
    </TableHeader>
    <TableBody>
        {campaigns.map((c) => (
            <TableRow key={c.id}>
                <TableCell>{c.title}</TableCell>
                <TableCell><Badge>{c.status}</Badge></TableCell>
            </TableRow>
        ))}
    </TableBody>
</Table>
```

### Dialog (Modal)
```tsx
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

<Dialog>
    <DialogTrigger asChild>
        <Button variant="destructive">Delete</Button>
    </DialogTrigger>
    <DialogContent>
        <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
        </DialogHeader>
        <p>This action cannot be undone.</p>
        <DialogFooter>
            <Button variant="outline">Cancel</Button>
            <Button variant="destructive">Delete</Button>
        </DialogFooter>
    </DialogContent>
</Dialog>
```

## Dark Mode

Add `dark` class to `<html>` element or use `next-themes`.

## Customization

Edit `components/ui/*.tsx` directly — you own the code.
Theme tokens in `tailwind.config.ts` under `theme.extend.colors`.
