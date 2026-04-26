-- Habilitar sistema de lealdade (prêmios e selos)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS loyalty_stamps INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_pending_reward BOOLEAN DEFAULT FALSE;

-- Função para atualizar lealdade ao entregar pedido
CREATE OR REPLACE FUNCTION update_loyalty_on_delivery()
RETURNS TRIGGER AS $$
DECLARE
    delivered_count INT;
BEGIN
    -- Se o status mudou para 'Entregue'
    IF NEW.status = 'Entregue' AND OLD.status != 'Entregue' THEN
        -- Conta quantos pedidos este usuário já teve entregues
        SELECT COUNT(*) INTO delivered_count 
        FROM public.orders 
        WHERE user_id = NEW.user_id AND status = 'Entregue';
        
        -- Se atingiu um múltiplo de 30 (30, 60, 90...)
        IF delivered_count > 0 AND delivered_count % 30 = 0 THEN
            UPDATE public.profiles 
            SET loyalty_stamps = loyalty_stamps + 1,
                has_pending_reward = TRUE
            WHERE id = NEW.user_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger disparado após atualização do pedido
DROP TRIGGER IF EXISTS on_order_delivered ON public.orders;
CREATE TRIGGER on_order_delivered
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION update_loyalty_on_delivery();
