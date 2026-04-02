import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosClient from "@/lib/axios";
import { 
    Ticket, 
    CrmTask, 
    CreateTicketDto, 
    CreateTaskDto, 
    UpdateTicketDto, 
    UpdateTaskDto 
} from "@/types/crm.types";

import { ApiResponse } from "@/types";

// --- TICKET HOOKS ---

// --- QUERY KEYS ---
export const crmKeys = {
  tasks: ["crm-tasks"] as const,
};

export const useTickets = (params?: any) => {
    return useQuery({
        queryKey: ["tickets", params],
        queryFn: async () => {
            const response = await axiosClient.get("/tickets", { params });
            return response;
        }
    });
};

export const useTicket = (id: number) => {
    return useQuery({
        queryKey: ["tickets", id],
        queryFn: async () => {
             const response = await axiosClient.get(`/tickets/${id}`);
             return response.data;
        },
        enabled: !!id
    });
};

export const useCreateTicket = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: CreateTicketDto) => {
            const response = await axiosClient.post("/tickets", data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tickets"] });
        }
    });
};

export const useUpdateTicket = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: UpdateTicketDto }) => {
            const response = await axiosClient.put(`/tickets/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tickets"] });
        }
    });
};

export const useDeleteTicket = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const response = await axiosClient.delete(`/tickets/${id}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tickets"] });
        }
    });
};


// --- TASK HOOKS ---

export const useCrmTasks = (params?: any) => {
    return useQuery({
        queryKey: [...crmKeys.tasks, params],
        queryFn: async () => {
            const { data } = await axiosClient.get<ApiResponse<CrmTask[]>>("/tasks", { params });
            return data;
        }
    });
};
export const useCreateCrmTask = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: CreateTaskDto) => {
            const response = await axiosClient.post("/tasks", data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["crm-tasks"] });
        }
    });
};

export const useUpdateCrmTask = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: UpdateTaskDto }) => {
             const response = await axiosClient.put(`/tasks/${id}`, data);
             return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["crm-tasks"] });
        }
    });
};

export const useDeleteCrmTask = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            await axiosClient.delete(`/tasks/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: crmKeys.tasks });
        }
    });
};
