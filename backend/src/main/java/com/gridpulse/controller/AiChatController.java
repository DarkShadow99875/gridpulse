package com.gridpulse.controller;

import com.gridpulse.service.AiChatService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
public class AiChatController {

    private final AiChatService aiChatService;

    public AiChatController(AiChatService aiChatService) {
        this.aiChatService = aiChatService;
    }

    @PostMapping("/chat")
    public AiChatService.ChatResponse chat(@RequestBody ChatRequest request) {
        return aiChatService.ask(request.question(), request.plantId());
    }

    public record ChatRequest(String question, Long plantId) {}
}
