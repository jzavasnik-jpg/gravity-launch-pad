import { useArchitectStore } from "@/store/architectStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Calculator } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';
import { cn } from "@/lib/utils";

export const ValueStackSection = () => {
    const { data, updateSection } = useArchitectStore();
    const { items, yourPrice } = data.valueStack;

    const addItem = () => {
        const newItem = { id: uuidv4(), name: "", value: 0 };
        updateSection('valueStack', { items: [...items, newItem] });
    };

    const removeItem = (id: string) => {
        updateSection('valueStack', { items: items.filter(i => i.id !== id) });
    };

    const updateItem = (id: string, field: 'name' | 'value', val: string | number) => {
        const newItems = items.map(i => {
            if (i.id === id) {
                return { ...i, [field]: val };
            }
            return i;
        });
        updateSection('valueStack', { items: newItems });
    };

    const totalValue = items.reduce((sum, item) => sum + Number(item.value || 0), 0);
    const discount = totalValue > 0 ? Math.round(((totalValue - yourPrice) / totalValue) * 100) : 0;

    return (
        <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
            {/* Header */}
            <div className="space-y-2">
                <h3 className="text-xl font-bold tracking-tight">Step 3: Make Saying No Feel Stupid</h3>
                <p className="text-sm text-muted-foreground">
                    Build a "Receipt" of everything they get. The total value should be at least 10x your price.
                </p>
            </div>

            {/* Receipt Builder */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Deliverables List</Label>
                    <Button variant="outline" size="sm" onClick={addItem} className="h-7 text-xs">
                        <Plus className="w-3 h-3 mr-1" /> Add Item
                    </Button>
                </div>

                <div className="space-y-2">
                    {items.map((item, idx) => (
                        <div key={item.id} className="flex gap-2 items-center group">
                            <span className="text-xs text-muted-foreground w-4">{idx + 1}.</span>
                            <Input
                                placeholder="Item Name (e.g. The Course)"
                                value={item.name}
                                onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                                className="flex-1 h-9 font-mono text-sm"
                            />
                            <div className="relative w-24">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">$</span>
                                <Input
                                    type="number"
                                    placeholder="0"
                                    value={item.value || ''}
                                    onChange={(e) => updateItem(item.id, 'value', Number(e.target.value))}
                                    className="pl-5 h-9 font-mono text-sm text-right"
                                />
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeItem(item.id)}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                    {items.length === 0 && (
                        <div className="text-center p-8 border border-dashed rounded-lg text-muted-foreground text-sm cursor-pointer hover:bg-muted/50 transition-colors" onClick={addItem}>
                            <Plus className="w-6 h-6 mx-auto mb-2 opacity-50" />
                            Click to add your first value item
                        </div>
                    )}
                </div>
            </div>

            {/* Price Input */}
            <div className="p-4 bg-muted/20 rounded-lg space-y-4 border">
                <div className="flex items-center gap-2 text-primary">
                    <Calculator className="w-4 h-4" />
                    <span className="font-bold text-sm">THE MATH</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1 opacity-70">
                        <Label className="text-xs">Total Value</Label>
                        <div className="text-2xl font-mono font-bold">${totalValue.toLocaleString()}</div>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-foreground">Your Price</Label>
                        <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                            <Input
                                type="number"
                                value={yourPrice || ''}
                                onChange={(e) => updateSection('valueStack', { yourPrice: Number(e.target.value) })}
                                className="pl-6 font-mono font-bold text-lg bg-background"
                            />
                        </div>
                    </div>
                </div>

                {totalValue > 0 && yourPrice > 0 && (
                    <div className="pt-2 border-t flex justify-between items-center">
                        <span className="text-sm font-medium">Customer Savings</span>
                        <span className={cn(
                            "px-2 py-1 rounded text-xs font-bold",
                            discount > 50 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                        )}>
                            {discount}% OFF
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};
