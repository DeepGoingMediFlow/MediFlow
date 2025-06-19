package kr.bigdata.web.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import kr.bigdata.web.entity.AvailableBeds;
import kr.bigdata.web.repository.AvailableBedsRepository;

@RestController
@RequestMapping("/api")
public class AvailableBedsController {
    
	 @Autowired
	    private AvailableBedsRepository repository;
	    
	    @GetMapping("/beds")
	    public List<AvailableBeds> getAvailableBeds() {
	        return repository.findLatestBeds();
	    }
}